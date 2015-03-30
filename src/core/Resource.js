'use strict';

import OpticObject from './OpticObject';
import Query from './Query';
import QueryTransforms from './QueryTransforms';
import Utils from './Utils';

const resourceConfigDefaults = {
};

var Resource = OpticObject.extend({
  init(attributes) {
    this._attributes = attributes;
  }

  get(key) {
    return this._attributes[key];
  }
}, {extend: extendResource});

/**
 * Create a custom subclass of Resource.
 */
function extendResource(props = {}, statics = {}) {
  var ResourceClass = OpticObject.extend.call(Resource, props, statics);
  // ResourceClass._classId = Utils.uid();
  // ResourceClass._config = config;
  buildDefaultQueryCreators(ResourceClass);
  return ResourceClass;
}


/**
 * Create top level query creators to support calls like MyResource.all(). These are just
 * query transforms that get applied to an fresh query.
 */
function buildDefaultQueryCreators(ResourceClass) {
  for (var transformName in QueryTransforms) {
    let query = new Query(ResourceClass).config(ResourceClass._config);
    ResourceClass[transformName] = () => QueryTransforms[transformName](query);
  }
}

export default Resource;
