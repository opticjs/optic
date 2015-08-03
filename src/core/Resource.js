'use strict';

import OpticObject from './OpticObject';
import Query from './Query';
import * as QueryTransforms from './QueryTransforms';
import * as Utils from './Utils';

const resourceConfigDefaults = {
  filterSets: [],
  adapter: null
};

var Resource = OpticObject.extend('Resource', {
  init(attributes) {
    this._attributes = attributes;
  },

  get(key) {
    return this._attributes[key];
  },

  toString(onlyAttributes) {
    if (onlyAttributes) {
      return this._super(['_attributes']);
    } else {
      return this._super();
    }
  }
});

Resource.extend = extendResource;

/**
 * Create a custom subclass of Resource.
 */
function extendResource(resourceName, props = {}, statics = {}) {
  var ResourceClass;
  var config = Utils.reduce(Utils.keys(resourceConfigDefaults), (memo, key) => Utils.extend(memo, {
    [key]: Utils.contains(Utils.keys(props), key) ? props[key] : resourceConfigDefaults[key]
  }), {});

  statics = Utils.extend(statics, {
    _classId: Utils.uid(),
    _config: config,
    getConfig: () => config
  });

  ResourceClass = OpticObject.extend.call(Resource, resourceName, props, statics);
  buildDefaultQueryCreators(ResourceClass);
  return ResourceClass;
}


/**
 * Create top level query creators to support calls like MyResource.all(). These are just
 * query transforms that get applied to an fresh query.
 */
function buildDefaultQueryCreators(ResourceClass) {
  for (var transformName in QueryTransforms) {
    (transformName => {
      ResourceClass[transformName] = (...args) => {
        return QueryTransforms[transformName]
            .apply(null, [new Query(ResourceClass)].concat(args));
      }
    })(transformName)
  }
}

export default Resource;
