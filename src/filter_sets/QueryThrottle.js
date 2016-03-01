import FilterSet from '../core/FilterSet';
import Query from '../core/Query';
import Response from '../core/Response';
import * as Utils from '../core/Utils';

var QueryThrottle = FilterSet.extend('QueryThrottle', {
  init(options = {}) {
    this.setProps(options);
    this._latestRequestedAt = 0;
    this._throttled = throttle((fn) => {
      fn();
    }, this.props().wait);
  },

  queryFilters() {
    return [
      {
        from: Query.States.IDLE,
        direction: 'outbound',
        filter: (query, emitResponse, cb) => {
          this._throttled(() => {
            this._callbackTriggered = true;
            cb();
          });

          // Clean up after any swallowed requests
          setTimeout(() => {
            if (!this._callbackTriggered) {
              cb(Query.States.CANCELED);
            }
          }, this.props().wait + 100);
        }
      }
    ];
  },

  responseFilters() {
    return [
      (response, query, callback) => {
        if (this.props().allowOutdatedResponses || !response.requestedAt ||
            response.requestedAt >= this._latestRequestedAt) {
          this._latestRequestedAt = response.requestedAt;
          callback(response);
        } else {
          callback();
        }
      }
    ];
  }
});

QueryThrottle.defaultProps = {
  allowOutdatedResponses: false,
  wait: 100
};

export default QueryThrottle;

/**
 * Thanks Jeremy Ashkenas! Taken from from http://underscorejs.org/docs/underscore.html
 */
function throttle(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function() {
    previous = options.leading === false ? 0 : new Date().getTime();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = new Date().getTime();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    } else {
      options.onSuppress && options.onSuppress();
    }
    return result;
  };
}
