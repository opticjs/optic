import FilterSet from '../core/FilterSet';
import Query from '../core/Query';
import Response from '../core/Response';
import * as Utils from '../core/Utils';

const availableOptions = function() {
  return {
    retryLimit: 3,
    retryDelay: 1000,
    maxTurbulence: 0
  };
};

export default FilterSet.extend('RateLimitRetry', {
  init(options) {
    this._retryCounts = new WeakMap();
    this._retryLimits = new WeakMap();
    this._retryDelays = new WeakMap();
    this._queryRetryBlacklist = new WeakSet();
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
            let count = filter._retryCounts.get(query) || 0;
            if (count + 1 < filter._retryLimitForQuery(query)) {
              filter._retryCounts.set(query, count + 1);
              setTimeout(() => {
                setTimeout(() => {
                  if (!filter._queryRetryBlacklist.has(query)) {
                    console.log(`retrying attempt #${filter._retryCounts.get(query) || 0}`);
                    cb(Query.States.SUBMITTING);
                  } else {
                    cb();
                  }
                }, filter._maxTurbulence * Math.random());
              }, filter._retryDelayForQuery(query));
            } else {
              filter._queryRetryBlacklist.add(query);
              cb();
            }
          } else {
            filter._queryRetryBlacklist.add(query);
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
      },

      withMaxTurbulence: function(turblence) {
        filter._maxTurbulence = turblence;
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

