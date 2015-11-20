'use strict';

import * as Utils from './Utils';
import * as Hash from '../utils/Hash';

/**
 * All classes in Optic extend from this base class.
 */
export default class OpticObject {}

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

  // The new class constructor that calls through to the `init` method. The eval is used to set
  // the proper class name for instances of the new class. This makes stack traces a lot more
  // useful. Dear person of the future, feel free to remove the eval if you find a better way to
  // achieve that goal.
  var NewClass = eval(`(
    function ${className}() {
      this._instanceId = Utils.uid();
      this._props = {};
      this.init && this.init.apply(this, arguments);
    }
  )`);

  // Copy statics
  Utils.each(statics, (val, key) => {
    NewClass[key] = val;
  });

  // Unique ID of this class
  NewClass._classId = Utils.uid();

  NewClass.prototype = Object.create(newPrototype);
  NewClass.prototype.constructor = NewClass;

  NewClass.prototype.setProps = function(props) {
    this._props = Utils.extend(this._props, props);
  };

  NewClass.prototype.toString = function() {
    return `<${className}>:${this._instanceId}`;
  };

  NewClass.prototype.stringify = function() {
    var rmCircularRefsAndStringify = (o, config = {}) => {
      config.map = config.map || new WeakMap();
      config.count = Utils.isUndefined(config.count) ? 0 : config.count;
      if (Utils.isArray(o)) {
	return Utils.map(o, item => rmCircularRefsAndStringify(item));
      } else if (Utils.isObject(o)) {
	if (config.map.has(o)) {
	  return `{ref: $${config.map.get(o)}}`;
	} else {
	  config.map.set(o, ++config.count);
	}

	if (o instanceof OpticObject) {
	  return rmCircularRefsAndStringify(o.props());
	}

	if (Utils.isPlainObject(o)) {
	  return Utils.reduce(Utils.keys(o), (memo, key) =>
	    Utils.extend(memo, {
	      [key]: rmCircularRefsAndStringify(o[key])
	    }), {});
	} else {
	  return Object.prototype.toString.call(o);
	}
      } else {
	return o;
      }
    };
    return JSON.stringify(rmCircularRefsAndStringify(this.props()));
  };

  NewClass.prototype.props = function() {
    function tap(o) {
      if (Utils.isArray(o)) {
	return Utils.map(o, item => tap(item));
      } else if (Utils.isObject(o)) {
	if (o instanceof OpticObject.Source) {
	  return tap(o.get());
	}

	if (Utils.isPlainObject(o)) {
	  return Utils.reduce(Utils.keys(o), (memo, key) => Utils.extend(memo, {[key]: tap(o[key])}), {});
	} else {
	  return o;
	}
      } else {
	return o;
      }
    }

    return Utils.extend(tap(this.constructor.defaultProps), tap(this._props));
  };

  NewClass.prototype.untappedProps = function() {
    return Utils.extend(this.constructor.defaultProps, this._props);
  };

  NewClass.extend = extend;
  NewClass.defaultProps = {};
  return NewClass;
};

OpticObject.extend = extend;

class Source {
  constructor(name, getter) {
    if (Utils.isFunction(name)) {
      getter = name;
      name = null;
    }
    this.name = name;
    this._getter = getter;
  }

  get() {
    return this._getter();
  }
}

OpticObject.Source = Source;
