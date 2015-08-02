'use strict';

import * as Utils from './Utils';
import * as Hash from '../utils/Hash';
import EventManager from './EventManager';

/**
 * All classes in Optic extend from this base class.
 */
export default class OpticObject extends EventManager {}

// TODO(lopatin) Can this (and option deconstruction) be implemented with prototypes? Instead
// of ugly property copying.
OpticObject.prototype._constructOptions = function(defaults, options) {
  Utils.each(defaults, (defaultVal, key) => {
    this['_' + key] = Utils.isUndefined(options[key]) ? defaultVal : options[key];
  });
};

OpticObject.prototype._deconstructOptions = function(defaults) {
  return Utils.reduce(
    Utils.keys(defaults),
    (memo, key) => Utils.extend(
        memo,
        this['_' + key] === defaults[key] ? {} : {[key]: this['_' + key]}
    ),
    {}
  );
};

OpticObject.prototype.toString = function(keys) {
  var objectSet = [];
  var convert = (o, keys) => {
    if (Utils.isFunction(o) || (o !== this && o instanceof OpticObject)) {
      return o.toString();
    } else if (Utils.isArray(o)) {
      return Utils.map(o, convert);
    } else if (Utils.isObject(o)) {
      return Utils.reduce(Utils.sort(keys || Utils.keys(o)), (memo, key) => {
        var setIndex = objectSet.indexOf(o[key]);
        var ret = Utils.extend(memo, {
          [key]: setIndex === -1 ? convert(o[key]) : `$ref-${setIndex}`
        });

        if (setIndex === -1) {
          objectSet.push(o[key]);
        }

        return ret;
      }, {});
    } else if (Utils.isUndefined(o)) {
      return 'undefined';
    } else {
      return o;
    }
  };

  return `<Object:${Hash.combinedHashFn(JSON.stringify(convert(this, keys)))}>`;
};

OpticObject.prototype.copy = function() {

};

OpticObject.prototype.init = () => {};

// Copied from http://ejohn.org/blog/simple-javascript-inheritance/
var extend = function(className, props, statics) {
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
  var NewClass = eval(`(
    function ${className}() {
      this._instanceId = Utils.uid();
      this.init && this.init.apply(this, arguments);
    }
  )`);

  // Copy statics
  Utils.each(statics, (val, key) => {
    NewClass[key] = val;
  });

  // Unique ID of this class
  NewClass._classId = Utils.uid();

  NewClass.prototype = newPrototype;
  NewClass.prototype.constructor = NewClass;
  NewClass.extend = extend;
  return NewClass;
};

OpticObject.extend = extend;
