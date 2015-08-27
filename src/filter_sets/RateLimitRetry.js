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
    this._retryDelays = new WeakMap();
    this._constructOptions(availableOptions(), options);
  },

  queryFilters() {
    var filter = this;
    return [
      {
        from: Query.States.SUBMITTING,
        to: Query.States.DONE,
        direction: 'outbound',
        filter: (query, emitResponse, cb) => {
          var response = query.getFinalResponse();
          if (response && response.status === Response.RATE_LIMIT) {
            let newCount = (filter._retryCounts.get(query) || 0) + 1;
            if (newCount < filter._retryLimitForQuery(query)) {
              setTimeout(() => {
                console.log(`retrying attempt #${filter._retryCounts.get(query) || 0}`);
                filter._retryCounts.set(query, newCount);
                cb(Query.States.SUBMITTING);
              }, filter._retryDelayForQuery(query));
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
        return this;
      },

      withRetryDelay: function(delay) {
        filter._retryDelays.set(this, delay);
        return this;
      }
    };
  },

  _retryLimitForQuery(query) {
    return this._retryLimits.get(query) || this._retryLimit;
  },

  _retryDelayForQuery(query) {
    return this._retryDelays.get(query) || this._retryDelay;
  }
});

