# Drawn Cross Links

Adds a "Drawn Cross Links" layer that will highlight crossing segments of drawn polylines and polygons.

This is a plugin for [Ingress Intel Total Conversion (IITC)](https://github.com/iitc-project/ingress-intel-total-conversion/).

## Overview

This plugin will clearly highlight any drawn segment that crosses any other previusly drawn segment.

## Installation
[Click here](https://github.com/manierim/drawn-crosslinks/raw/master/drawn-crosslinks.user.js) and your userscript manager should do it.

## Requirements

This plugin requires:

- [draw tools](https://iitc.me/desktop/): Obviously...
- [cross links](https://iitc.me/desktop/): Needed for its accurate "greatCircleArcIntersect" function

## Usage

Install it and make sure the "Drawn Cross Links" layer is activated.

## Compatibility

The plugin has been tested with the following versions (current at the time of writing) **on IITC desktop**:
- draw tools version 0.7.0.20181031.195523
- cross links version 1.1.2.20181031.195523

Modifications of both plugins might work as long as they do not change the original plugin behavior too much.

- [Crosslinks Enhancements](https://github.com/manierim/crosslinks-enhancements): drawn items color selection

## Changelog

- 2019-07-09 (version 1.0)
  + Initial Release
