'use strict';

/**
 * Generate a unique string id.
 */
var uidCount = 0;
export function uid() {
  return 'uid_' + ++uidCount;
}

/**
 * Filter out elements of the array that don't pass the predicate.
 */
export function select(list, predicate) {
  var filteredList = [];
  for (var i = 0; i < list.length; i++) {
    if (predicate(list[i], i)) {
      filteredList.push(list[i]);
    }
  }
  return filteredList;
}

/**
 * Standard map higher order function.
 */
export function map(list, transform) {
  var mappedList = [];
  for (var i = 0; i < list.length; i++) {
    mappedList.push(transform(list[i]));
  }
  return mappedList;
}

export function reduce(list, fn, memo) {
  return list.length === 0 ? memo :
      fn(reduce(list.slice(0, list.length - 1), fn, memo), list[list.length - 1]);
}

export function flatten(listOfLists) {
  return reduce(listOfLists, (memo, item) => memo.concat(item), []);
}

/**
 * Return a version of the list without the specified object.
 */
export function without(list, withoutThis) {
  return select(list, item => item !== withoutThis);
}

export function unique(list) {
  return reduce(list, (memo, item) =>
      contains(memo, item) ? memo : memo.concat([item]), []);
}

export function union(...lists) {
  return unique(flatten(lists));
}

/**
 * Invoke `fn` for each item in the enumerable.
 */
export function each(list, fn) {
  if (list instanceof Array) {
    for (var i = 0; i < list.length; i++) {
      fn(list[i], i);
    }
  } else {
    for (var key in list) {
      fn(list[key], key);
    }
  }
}

export function last(list) {
  return list[list.length - 1];
}

/**
 * Return a copy of the object extended with all the properites of the other
 * objects in the parameters.
 */
export function extend(obj, ...extensions) {
  var o = clone(obj);
  extensions.forEach(extension => {
    for (var key in extension) {
      o[key] = extension[key];
    }
  });
  return o;
}

export function merge(objects) {
  return extend.apply(objects[0], objects.slice(1));
}

export function contains(list, val) {
  return list.indexOf(val) !== -1;
}

export function omit(obj, ...keysToOmit) {
  return reduce(
    keys(obj),
    (memo, key) => extend(memo, contains(keysToOmit, key) ? {} : {[key]: obj[key]}),
    {}
  );
}

/**
 * Shallow copy of an object.
 */
export function clone(obj) {
  var copy = {};
  for (var key in obj) {copy[key] = obj[key];}
  return copy;
}

/**
 * Throw an error with an optional error message if the condition isn't true.
 */
export function assert(condition, message = 'Precondition Error') {
  if (!condition) {
    var error = new Error(message);
    error.framesToPop = 1;
    throw error;
  }
}

/**
 * Returns a list of keys in the supplied object.
 */
export function keys(obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }
  return keys;
}

export function sort(list) {
  return list.slice().sort((a, b) => a < b ? -1 : 1);
}

/**
 * A probably over-cautious method of detecting if a value is `undefined`. Taken from
 * Underscore's implementation of the same method.
 */
export function isUndefined(val) {
  return val === void 0;
}

export function isNumber(val) {
  return typeof val === 'number';
}

export function isString(val) {
  return typeof val === 'string';
}

export function isObject(val) {
  return typeof val === 'object' && !isNull(val);
}

export function isFunction(val) {
  return typeof val === 'function';
}

export function isArray(val) {
  return val instanceof Array;
}

export function isArrayOf(val, type) {
  if (!isArray(val)) {
    return false;
  }

  for (let i = 0; i < val.length; i++) {
    if (!val[i] instanceof type) {
      return false;
    }
  }

  return true;
}

export function isNull(val) {
  return val === null;
}

/**
 * This function is intentionally left blank.
 */
export function noOp() {}
