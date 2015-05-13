import FilterSet from '../core/FilterSet';
import Query from '../core/Query';

var QueryCache = FilterSet.extend({
  init() {
    this._resources = {};
  },

  filters: [
    {
      to: Query.States.DONE,
      filter: (query, emitResponse, cb) => {
        cb();
      }
    },

    {
      from: Query.States.IDLE,
      to: Query.States.SUBMITTING,
      filter: (query, emitResponse, cb) => {
        cb();
      }
    }
  ],

  queryMethods: {

  }
});

export default QueryCache;
