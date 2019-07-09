// ==UserScript==
// @id             drawn-crosslinks
// @name           Drawn Cross Links
// @description    Adds a "Drawn Cross Links" layer that will highlight crossing segments of drawn polylines and polygons.
// @category       Misc
// @version        1.0
// @author         MarcioPG
// @website        https://github.com/manierim/drawn-crosslinks
// @updateURL      https://github.com/manierim/drawn-crosslinks/raw/master/drawn-crosslinks.meta.js
// @downloadURL    https://github.com/manierim/drawn-crosslinks/raw/master/drawn-crosslinks.user.js
// @namespace      https://github.com/manierim
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper() {

    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    // PLUGIN START ////////////////////////////////////////////////////////

    window.plugin.drawnCrossLinks = function () { };
    var $plugin = window.plugin.drawnCrossLinks;

    //-------------------------------------------------------------
    // Setup
    //-------------------------------------------------------------

    var setup = function () {

        if (window.iitcLoaded !== undefined && window.iitcLoaded) {
            $plugin.init();
        }
        else {
            window.addHook('iitcLoaded', $plugin.init);
        }

    }

    //-------------------------------------------------------------
    // Init 
    //-------------------------------------------------------------

    $plugin.init = function () {

        var exit = false;

        // we need the crossLinks plugin cross detection functions
        if (window.plugin.crossLinks === undefined) {
            console.warn('Drawn Items Crosslinks: crossLinks plugin not found');
            exit = true;
        }

        // that's obvious....
        if (window.plugin.drawTools === undefined) {
            console.warn('Drawn Items Crosslinks: drawTools plugin not found');
            exit = true;
        }

        if (exit) {
            return;
        }

        $plugin.createLayer();

        $plugin.testAllDrawnItems();

        // this plugin also needs to create the draw-tools hook, in case it is initialised before draw-tools
        window.pluginCreateHook('pluginDrawTools');

        window.addHook('pluginDrawTools', function (e) {

            if (e.event !== undefined) {
                if (
                    e.event == 'layerCreated'
                ) {
                    // we can just test the new layer in this case
                    $plugin.testNewDrawnItem(e.layer);
                }
                else if (
                    e.event === 'import'
                    || e.event === 'clear'
                    || e.event === 'layersSnappedToPortals'
                    || e.event === 'layersDeleted'
                    || e.event === 'layersEdited'
                ) {
                    $plugin.testAllDrawnItems();
                }
                else if (
                    e.event !== 'openOpt'
                ) {
                    console.log('Drawn Items Crosslinks: unknown pluginDrawTools event', e.event);
                }
            }
        });

    }

    //-------------------------------------------------------------
    // Test functions
    //-------------------------------------------------------------

    $plugin.ignoreDrawnItem =function (drawnItem) {

        if (!(
            drawnItem instanceof L.GeodesicPolygon
            || drawnItem instanceof L.GeodesicPolyline
        )
        ) {
            return true;
        }

        if (
            window.plugin.crossLinksEnhancements !== undefined
            && !window.plugin.crossLinksEnhancements.filters.colors.shouldCheckDrawnItem(drawnItem)
        ) {
            return true;
        }

        return false;

    }

    $plugin.testDrawnItem = function (drawnItem1, drawnItem2) {

        if (
            $plugin.ignoreDrawnItem(drawnItem1)
            || $plugin.ignoreDrawnItem(drawnItem2)
        ) {
            return;
        }

        var latLngs1 = drawnItem1.getLatLngs();
        var limit1 = latLngs1.length - 1;
        if (drawnItem1 instanceof L.GeodesicPolygon) {
            limit1++;
        }


        var latLngs2 = drawnItem2.getLatLngs();
        var limit2 = latLngs2.length - 1;
        if (drawnItem2 instanceof L.GeodesicPolygon) {
            limit2++;
        }

        for (var idx1 = 0; idx1 < limit1; ++idx1) {

            var start1 = latLngs1[idx1];

            if (idx1 >= latLngs1.length - 1) {
                var end1 = latLngs1[0];
            }
            else {
                var end1 = latLngs1[idx1 + 1];
            }

            for (var idx2 = 0; idx2 < limit2; ++idx2) {

                var start2 = latLngs2[idx2];

                if (idx2 >= latLngs2.length - 1) {
                    var end2 = latLngs2[0];
                }
                else {
                    var end2 = latLngs2[idx2 + 1];
                }

                if (window.plugin.crossLinks.greatCircleArcIntersect(
                    start1, end1,
                    start2, end2
                )) {
                    $plugin.showLink(start2, end2);
                };

            }

        }

    }

    $plugin.testNewDrawnItem = function (drawnLayer) {

        if ($plugin.disabled) return;

        if (!(
            drawnLayer instanceof L.GeodesicPolygon
            || drawnLayer instanceof L.GeodesicPolyline
        )
        ) {
            return;
        }

        for (var i in plugin.drawTools.drawnItems._layers) {
            var layer = plugin.drawTools.drawnItems._layers[i];

            if (!(
                layer instanceof L.GeodesicPolygon
                || layer instanceof L.GeodesicPolyline
            )
            ) {
                continue;
            }

            $plugin.testDrawnItem(layer, drawnLayer);

        };

    }

    $plugin.testAllDrawnItems = function () {

        if ($plugin.disabled) return;

        $plugin.crossLayer.clearLayers();

        // we get the layers as array to loop them in reverse order
        var drawnItems = plugin.drawTools.drawnItems.getLayers();

        for (var newerIdx = drawnItems.length; newerIdx > 0; newerIdx--) {

            var newerLayer = drawnItems[newerIdx];

            if (!(
                newerLayer instanceof L.GeodesicPolygon
                || newerLayer instanceof L.GeodesicPolyline
            )
            ) {
                continue;
            }

            for (var olderIdx = newerIdx - 1; olderIdx >= 0; olderIdx--) {

                var olderLayer = drawnItems[olderIdx];

                if (!(
                    olderLayer instanceof L.GeodesicPolygon
                    || olderLayer instanceof L.GeodesicPolyline
                )
                ) {
                    continue;
                }

                $plugin.testDrawnItem(olderLayer, newerLayer);

            }

        };

    }

    //-------------------------------------------------------------
    // Drawn Cross Links layer
    //-------------------------------------------------------------

    $plugin.createLayer = function () {

        $plugin.crossLayer = new L.FeatureGroup();

        window.addLayerGroup('Drawn Cross Links', $plugin.crossLayer, true);

        map.on('layeradd', function (obj) {
            if (obj.layer === $plugin.crossLayer) {
                delete $plugin.disabled;
                $plugin.testAllDrawnItems();
            }
        });
        map.on('layerremove', function (obj) {
            if (obj.layer === $plugin.crossLayer) {
                $plugin.disabled = true;
                $plugin.crossLayer.clearLayers();
            }
        });

        // ensure 'disabled' flag is initialised
        if (!map.hasLayer($plugin.crossLayer)) {
            $plugin.disabled = true;
        }
    }

    $plugin.showLink = function (start, end) {

        if ($plugin.disabled) return;

        var poly = L.geodesicPolyline([start, end], {
            color: '#d22',
            opacity: 0.7,
            weight: 10,
            clickable: false,
            dashArray: [5, 15],
        });

        poly.addTo($plugin.crossLayer);

    }




    // PLUGIN END //////////////////////////////////////////////////////////

    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();

}
// WRAPPER END /////////////////////////////////////////////////////////////

// inject code into site context ///////////////////////////////////////////

var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + wrapper + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);
