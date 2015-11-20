import FilterSet from '../core/FilterSet';
import HashMap from '../structs/HashMap';
import Query from '../core/Query';
import * as Utils from '../core/Utils';
import deepEqual from '../core/deepEquals';

/**
 * QueryCombiner makes sure that any concurrent and identical queries are merged into one query
 * under the hood. After the request finishes, the query callbacks for all of the original queries
 * before the merge are fired independently.
 */

export default FilterSet.extend('QueryCombiner', {
  init() {
    this._queryBuckets = new HashMap(deepEqual);
  },

  queryFilters() {
    return [
      {
        from: Query.States.IDLE,
        to: Query.States.SUBMITTING,
        filter: (query, emitResponse, cb) => {
          var bucket = this._queryBuckets.get(query);

          if (bucket) {
	    console.log('***************');
	    console.log(bucket);
            bucket.callbacks.push({
              query: query,
              emitResponse: emitResponse,
              cb: cb
            });
          } else {
	    console.log('###############');
	    console.log(query);
            this._queryBuckets.set(query, {
              originalQuery: query,
              callbacks: []
            });
            cb();
          }
        }
      },

      {
        to: Query.States.DONE,
        filter: (query, emitResponse, cb) => {
          var bucket = this._queryBuckets.get(query);

          if (bucket && bucket.originalQuery === query) {
            Utils.each(bucket.callbacks, cbs => {
              var response = query.getFinalResponse();
              if (response) {
                cbs.emitResponse(query.getFinalResponse());
                cbs.cb(Query.States.DONE);
              }
            });
            this._queryBuckets.remove(query);
          }

          cb();
        }
      }
    ];
  }
});
