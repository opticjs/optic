'use strict';

import {hashCode} from '../utils/Hash';
import * as Utils from '../core/Utils';

export default class HashMap {
  constructor(equals) {
    this._equals = equals || ((l, r) => l === r);
    this._buckets = {};
  }
  
  get(key) {
    var bucket = this._buckets[hashKey(key)];
    if (bucket) {
      let hi = this._findNodeInBucket(bucket, key);
      return (hi || {}).val;
    }
  }

  has(key) {
    return !Utils.isUndefined(this.get(key));
  }

  set(key, val) {
    if (Utils.isUndefined(val)) {
      throw new Error('HashMap value cannot be `undefined`.');
    }

    var bucket = this._buckets[hashKey(key)];
    var node;

    if (bucket) {
      node = this._findNodeInBucket(bucket, key);
    } else {
      bucket = this._buckets[hashKey(key)] = [];
    }

    if (!node) {
      node = {key: key, val: val};
      bucket.push(node);
    } else {
      node.val = val;
    }
  }

  remove(key) {
    if (!this.has(key)) {
      return;
    }

    var hash = hashKey(key);
    var node = this._findNodeInBucket(this._buckets[hash], key);
    this._buckets[hash] = Utils.without(this._buckets[hash], node);
    return node.val;
  }

  _findNodeInBucket(bucket, key) {
    return Utils.find(bucket, node => this._equals(node.key, key));
  }
}

function hashKey(key) {
  return hashCode(stringify(key));
}

function stringify(key) {
  return (Utils.isObject(key) && !Utils.isPlainObject(key) && key.stringify) ?
    key.stringify() : JSON.stringify(key);
}
