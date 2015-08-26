import FilterSet from '../core/FilterSet';
import Query from '../core/Query';
import Response from '../core/Response';
import * as Utils from '../core/Utils';

const availableOptions = function() {
  return {
    retryLimit: false
  };
};

export default FilterSet.extend('QueryThrottle', {
  init(options) {
    this._constructOptions(availableOptions, options);
    this._retryCounts = new WeakMap();
  },

  queryFilters() {
    return [
      {
        from: Query.States.SUBMITTING,
        to: Query.States.DONE,
        direction: 'outbound',
        filter: (query, emitResponse, cb) => {
          var response = query.getFinalResponse();
          if (response && response.status === Response.RATE_LIMIT) {
            let newCount = (this._retryCounts.get(queryKey) || 0) + 1;

            if (newCount < this._retryLimit) {
              console.log(`retrying attempt #${this._retryCounts.get(queryKey) || 0}`);
              this._retryCounts.set(queryKey, newCount);
              cb(Query.States.SUBMITTING);
            } else {
              cb();
            }
          } else {
            cb();
          }
        }
      }
    ];
  }
});

