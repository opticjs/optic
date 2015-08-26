import FilterSet from '../core/FilterSet';
import Resource from '../core/Resource';
import * as Utils from '../core/Utils';

/**
 * The ResourceLinker filter set monitors all responses and ensures that identical resources that
 * are spread across multiple responses are still comparable with reference equality (===).
 */
export default FilterSet.extend('ResourceLinker', {
  init() {
    this._refTimeout = 60 * 1000;
    this._resourceRefs = {};
  },

  responseFilters() {
    return [
      (response, callback) => {
        if (!response.data) {
          callback(response);
          return;
        }

        // A function that takes in a resource and returns the linked resource if the ref
        // exists and is not expired.
        const fetchResourceRef = resource => {
          var resourceKey = resource.toString(true);
          var ref = this._resourceRefs[resourceKey];
          var now = new Date().getTime();

          if (ref) {
            if (ref.timestamp + this._refTimeout < now) {
              // If the ref is expired, then invalidate it.
              delete this._resourceRefs[resourceKey];
            } else {
              // Otherwise return the ref instead of the original resource.
              resource = ref.resource;
            }
          }

          // Add the resource to the _resourceRefs map of refs if it's not there.
          if (!this._resourceRefs[resourceKey]) {
            this._resourceRefs[resourceKey] = {
              timestamp: now,
              resource: resource
            };
          }

          return resource;
        };

        // Detect resources from response
        var resources = [];
        if (response.data instanceof Resource) {
          response.data = fetchResourceRef(response.data);
        } else if (Utils.isArrayOf(response.data, Resource)) {
          response.data = Utils.map(response.data, fetchResourceRef);
        }

        callback(response);
      }
    ];
  }
});
