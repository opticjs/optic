import FilterSet from '../core/FilterSet';
import Query from '../core/Query';
import Response from '../core/Response';
import * as Utils from '../core/Utils';

const availableOptions = function() {
  return {
    retryLimit: 3,
    retryDelay: 1000
  };
};

export default FilterSet.extend('RateLimitRetry', {
  init(options) {
    this._retryCounts = new WeakMap();
    this._retryLimits = new WeakMap();
    this._constructOptions(availableOptions, options);
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
            if (newCount < this._retryLimitForQuery(query)) {
              setTimeout(() => {
                console.log(`retrying attempt #${this._retryCounts.get(queryKey) || 0}`);
                this._retryCounts.set(queryKey, newCount);
                cb(Query.States.SUBMITTING);
              }, this._retryDelay);
            } else {
              cb();
            }
          } else {
            cb();
          }
        }
      }
    ];
  },

  queryMethods() {
    var filter = this;
    return {
      withRetryLimit: function(limit) {
        filter._retryLimits.set(this, limit);
      }
    };
  },

  _retryLimitForQuery(query) {
    return this._retryLimits[query] || this._retryLimit;
  }
});

