import deepEqual from '../core/deepEquals';
import FilterSet from '../core/FilterSet';
import HashMap from '../structs/HashMap';
import Query from '../core/Query';
import Adapter from '../core/Adapter';
import * as Utils from '../core/Utils';

/**
 * Saves a reference to every response that passes through this filter, keyed by the toString()
 * of the associated query.
 */
export default FilterSet.extend('QueryCache', {
  init() {
    this._responses = new HashMap(deepEqual);
    this._invalidations = {};
  },

  queryFilters() {
    return [
      {
        from: Query.States.IDLE,
        to: Query.States.SUBMITTING,
        filter: (query, emitResponse, cb) => {
          var response = this._responses.get(query);
          if (response) {
            emitResponse(response);
            cb(Query.States.DONE);
          } else {
            cb();
          }
        }
      },

      // TODO(lopatin) Will this work if the query params have changed after putting it into the
      // deep map?

      {
        to: Query.States.DONE,
        filter: (query, emitResponse, cb) => {
          var response = query.getFinalResponse();
 
          if (query.getAction() === Adapter.Actions.FETCH && !this._responses.has(query) &&
              response) {
            this._responses.set(query, response);
          }

          if (response && response.isSuccessful()) {
            // Invalidate queries that depend on this one
            if (this._invalidations[query.props.key]) {
              var qs = [];
              Utils.each(this._invalidations[query.props.key], q => {
                this._responses.remove(q);
                qs.push(q);
                this._invalidations[query.props.key] = Utils.without(
                    this._invalidations[query.props.key], q);
                if (this._invalidations[query.props.key].length === 0) {
                  delete this._invalidations[query.props.key];
                }
              });

              // Call the invalidation function to let each query know that it has been
              // invalidated.
              for (var i = 0; i < qs.length; i++) {
                var q = qs[i];
                if (q.props.invalidationFn) {
                  q.props.invalidationFn(query);
                }
              }
            }
          }

          cb();
        }
      }
    ];
  },

  queryMethods() {
    var filter = this;

    return {
      onQueryCacheInvalidate: function(invalidator) {
        this.setProps({invalidationFn: invalidator});
        return this;
      },

      queryCacheDeps: function(keys = []) {
        if (!Utils.isArray(keys)) {
          keys = [keys];
        }
        Utils.each(keys, key => {
          filter._invalidations[key] = Utils.union(filter._invalidations[key] || [], [this]);
        });
        return this;
      }
    };
  }
});
