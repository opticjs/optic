'use strict';

import {hashCode} from '../utils/Hash';
import * as Utils from '../core/Utils';

export default class HashMap {
  constructor(equals) {
    this._equals = equals || ((l, r) => l === r);
    this._buckets = {};
  }
  
  get(key) {
    console.log('requesting ' + hashKey(stringify(key)));
    var bucket = this._buckets[hashKey(key)];
    if (bucket) {
      let hi = this._findNodeInBucket(bucket, key);
      console.log('bucket found', bucket, key);
      console.log(hi && hi.val);
      return (hi || {}).val;
    }
  }

  has(key) {
    // console.log('has: ' + stringify(key));
    // console.log(hashKey(key));
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
      console.log('pushed ' + hashKey(stringify(key)));
    } else {
      node.val = val;
    }

    // console.log(`set ${stringify(key)} to ${val}`);
    // console.log(this._buckets);
    // console.log(this._equals);
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
    console.log('finding in bucket', bucket, key);
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
