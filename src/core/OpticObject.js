'use strict';

import * as Utils from './Utils';

/**
 * All classes in Optic extend from this base class.
 */
export default class OpticObject {}

OpticObject.prototype._constructOptions = function(defaults, options) {
  Utils.each(defaults, (defaultVal, key) => {
    this['_' + key] = Utils.isUndefined(options[key]) ? defaultVal : options[key];
  });
};

OpticObject.prototype._deconstructOptions = defaults => Utils.reduce(
    Utils.keys(defaults),
    (memo, key) => Utils.extend(
        memo,
        this['_' + key] === defaults[key] ? {} : {[key]: this['_' + key]}
    ),
    {}
);

OpticObject.prototype.init = () => {};

// Inspired (copied) from http://ejohn.org/blog/simple-javascript-inheritance/
var extend = function(props, statics) {
  var newPrototype = new this();
  var _super = this.prototype;

  // Copy instance properties to new prototype
  for (var field in props) {
    newPrototype[field] = Utils.isFunction(props[field]) && Utils.isFunction(_super[field]) ?
        (function(field, fn) {
          return function() {
            var ret, originalSuper = this._super;
            this._super = _super[field];
            ret = fn.apply(this, arguments);
            this._super = originalSuper;
            return ret;
          };
        })(field, props[field]) :
        props[field];
  }

  // The new class constructor that calls through to the `init` method.
  function NewClass() {
    this.init && this.init.apply(this, arguments);
  }

  // Copy statics
  Utils.each(statics, (val, key) => {
    NewClass[key] = val;
  });

  NewClass.prototype = newPrototype;
  NewClass.prototype.constructor = NewClass;
  NewClass.extend = extend;
  return NewClass;
};

OpticObject.extend = extend;
