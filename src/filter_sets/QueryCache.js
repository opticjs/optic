import FilterSet from '../core/FilterSet';
import Query from '../core/Query';

var QueryCache = FilterSet.extend({
  init() {
    this._responses = {};
  },

  filters() {
    return [
      {
        from: Query.States.IDLE,
        to: Query.States.SUBMITTING,
        filter: (query, emitResponse, cb) => {
          var key = query.toString(false);
          var response = this._responses[key];

          if (response) {
            emitResponse(response);
            cb(Query.States.DONE);
          } else {
            cb();
          }
        }
      },

      {
        to: Query.States.DONE,
        filter: (query, emitResponse, cb) => {
          var key = query.toString(false);
          var response = query.getFinalResponse();

          if (!this._responses[key] && response) {
            this._responses[key] = response;
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

export default QueryCache;
