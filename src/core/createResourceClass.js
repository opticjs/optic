'use strict';

var Query = require('./Query');
var QueryTransforms = require('./QueryTransforms');
var Cache = require('./Cache');
var Resource = require('./Resource');
var Utils = require('./Utils');

/**
 * Create a custom subclass of Resource.
 */
function createResourceClass(config = {}, properties = {}, statics = {}) {
  class ResourceClass extends Resource {}
  ResourceClass._classId = Utils.uid();
  ResourceClass._config = config;

  // Set prototype properties
  for (var propertyName in properties) {
    ResourceClass.prototype[propertyName] = properties[propertyName];
  }

  // Set statics
  for (var staticName in statics) {
    ResourceClass[staticName] = statics[staticName];
  }

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

module.exports = createResourceClass;
