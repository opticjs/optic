'use strict';

var Utils = require('./Utils');

class OpticObject {
  _construct(defaults, options) {
    Utils.each(defaults, (defaultVal, key) => {
      this['_' + key] = Utils.isUndefined(options[key]) ? defaultVal : options[key];
    });
  }

  _deconstruct(defaults) {
    var options = Utils.clone(defaults);
    Utils.each(options, (val, key) => {
      options[key] = this['_' + key];
    });
    return options;
  }
}
