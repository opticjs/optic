import * as Utils from '../core/Utils';

/**
 * A DeepKeyedSet stores values along with a unique key. The key can be any JavaScript value and
 * it's uniqueness is determined via logical equality vs reference equality.
 *
 * Example:
 * var set = new DeepKeyedSet();
 * set.add({this: {is: "a key"}}, "value");
 * set.get({this: {is: "a key"}}) === "value";
 */

export default class DeepKeyedSet {
  constructor() {
    this._root = new Node({});
  }

  add(key, val) {
  }

  get() {
  }

  remove() {
  }
}

class Node {
  /**
   * Recursive constructor builds out a sub-tree of Nodes based on the val.
   */
  constructor(val, parentSet) {
    this._val = val;
    parentSet = parentSet || new WeakSet();

    if (Utils.isFunction(val)) {
      throw new Error('DeepKeyedSet does not support functions.');
    }

    if (parentSet.has(val)) {
      throw new Error('DeepKeyedSet does not support circular data structures.');
    }

    if (this._type() === 'object') {
      this._children = Utils.map(Utils.sort(Utils.keys(val)), key => new Node(val[key], parentSet));
    }
  }

  /**
   * Compute and return the type of this nodes value.
   */
  _type() {
    if (Utils.isObject(val)) {
      return 'object';
    } else if (Utils.isArray(val)) {
      return 'array';
    } else {
      return 'other';
    }
  }
}
