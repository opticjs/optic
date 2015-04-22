'use strict';

import OpticObject from './OpticObject';
import Query from './Query';
import * as QueryTransforms from './QueryTransforms';
import * as Utils from './Utils';

const resourceConfigDefaults = {
  filters: [],
  adapter: null
};

var Resource = OpticObject.extend({
  init(attributes) {
    this._attributes = attributes;
  },

  get(key) {
    return this._attributes[key];
  }
});

Resource.extend = extendResource;

/**
 * Create a custom subclass of Resource.
 */
function extendResource(props = {}, statics = {}) {
  statics = Utils.extend(statics, {
    _classId: Utils.uid(),
    _config: Utils.reduce(Utils.keys(resourceConfigDefaults), (memo, key) => Utils.extend(memo, {
      [key]: Utils.contains(Utils.keys(props), key) ? props[key] : resourceConfigDefaults[key]
    }), {})
  });

  var ResourceClass = OpticObject.extend.call(Resource, props, statics);
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
    (transformName => {
      ResourceClass[transformName] = (...args) =>
        QueryTransforms[transformName].apply(null, [query].concat(args));
    })(transformName)
  }
}

export default Resource;
