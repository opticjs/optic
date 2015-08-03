import FilterSet from '../core/FilterSet';
import Query from '../core/Query';
import * as Utils from '../core/Utils';

/**
 * QueryLinker makes sure that any concurrent and identical queries are merged into one query
 * under the hood. After the request finishes, the query callbacks for all of the original
 * queries before the merge are fired independently.
 */

export default FilterSet.extend('QueryCombiner', {
  init() {
    this._queryBuckets = {};
  },

  queryFilters() {
    return [
      {
        from: Query.States.IDLE,
        to: Query.States.SUBMITTING,
        filter: (query, emitResponse, cb) => {
          var key = query.toString(false);
          var bucket = this._queryBuckets[key];

          if (bucket) {
            bucket.callbacks.push({
              query: query,
              emitResponse: emitResponse,
              cb: cb
            });
          } else {
            this._queryBuckets[key] = {
              originalQuery: query,
              callbacks: []
            };
            cb();
          }
        }
      },

      {
        to: Query.States.DONE,
        filter: (query, emitResponse, cb) => {
          var key = query.toString(false);
          var bucket = this._queryBuckets[key];

          if (bucket && bucket.originalQuery === query) {
            Utils.each(bucket.callbacks, cbs => {
              cbs.emitResponse(query.getFinalResponse());
              cbs.cb(Query.States.DONE);
            });
            this._queryBuckets[key] = null;
          }

          cb();
        }
      }
    ];
  },

  queryMethods() {
    return {};
  }
});