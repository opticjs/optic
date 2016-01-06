import deepEqual from '../core/deepEquals';
import FilterSet from '../core/FilterSet';
import HashMap from '../structs/HashMap';
import Query from '../core/Query';
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
          this._responses.has(query);
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
 
          if (!this._responses.has(query) && response) {
            this._responses.set(query, response);

            // Invalidate queries that depend on this one
            if (this._invalidations[query.props().id]) {
              Utils.each(this._invalidations[query.props().id], q => {
                this._responses.remove(q);
                this._invalidations[query.props().id] = Utils.without(
                    this._invalidations[query.props().id], q);
                if (this._invalidations[query.props().id].length === 0) {
                  delete this._invalidations[query.props().id];
                }
              });
              filter.props().invalidationFn && filter.props().invalidationFn(query,
                  this._invalidations[query.props().id]);
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
        filter.setProps({invalidationFn: invalidator});
        return this;
      },

      queryCacheDeps: function(ids = []) {
        if (!Utils.isArray(ids)) {
          ids = [ids];
        }
        Utils.each(ids, id => {
          filter._invalidations[id] = Utils.union((filter._invalidations[id]) || [], [this]);
        });
        return this;
      }
    };
  }
});
