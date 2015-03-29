'use strict';

/**
 * Generate a unique string id.
 */
var uidCount = 0;
function uid() {
  return 'uid_' + ++uidCount;
}

/**
 * Filter out elements of the array that don't pass the predicate.
 */
function select(list, predicate) {
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
function map(list, transform) {
  var mappedList = [];
  for (var i = 0; i < list.length; i++) {
    mappedList.push(transform(list[i]));
  }
  return mappedList;
}

/**
 * Return a version of the list without the specified object.
 */
function without(list, withoutThis) {
  return select(list, item => item !== withoutThis);
}

/**
 * Invoke `fn` for each item in the enumerable.
 */
function each(list, fn) {
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

/**
 * Return a copy of the object extended with all the properites of the other
 * objects in the parameters.
 */
function extend(obj, ...extensions) {
  if (extensions.length === 1) {
    let o = clone(obj);
    for (var key in extensions[0]) {o[key] = extensions[0][key];}
    return o;
  } else {
    return extend(obj, extend(extensions[0], extensions.slice(1)));
  }
}

/**
 * Shallow copy of an object.
 */
function clone(obj) {
  var copy = {};
  for (var key in obj) {copy[key] = obj[key];}
  return copy;
}

/**
 * Throw an error with an optional error message if the condition isn't true.
 */
function invariant(condition, message = 'Precondition Error') {
  if (!condition) {
    var error = new Error(message);
    error.framesToPop = 1;
    throw error;
  }
}

/**
 * A probably over-cautious method of detecting if a value is `undefined`. Taken from
 * Underscore's implementation of the same method.
 */
function isUndefined(val) {
  return val === void 0;
}

function isNumber(val) {
  return typeof val === 'number';
}

/**
 * This function is intentionally left blank.
 */
function noOp() {}

module.exports = {
  uid: uid,
  select: select,
  map: map,
  without: without,
  invariant: invariant,
  noOp: noOp,
  extend: extend,
  clone: clone,
  each: each,
  isUndefined: isUndefined,
  isNumber: isNumber
};
