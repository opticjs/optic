import deepEqual from '../core/deepEquals';
import FilterSet from '../core/FilterSet';
import HashMap from '../structs/HashMap';
import Query from '../core/Query';
import Response from '../core/Response';
import Adapter from '../core/Adapter';
import * as Utils from '../core/Utils';

/**
 * Remember responses to queries and respond with provisional versions of those responses for
 * new queries that are identical to the original.
 */
export default FilterSet.extend('FetchMemory', {
  init() {
    this._memory = new HashMap(deepEqual);
  },

  queryFilters() {
    return [
      {
        from: Query.States.IDLE,
        to: Query.States.SUBMITTING,
        filter: (query, emitResponse, cb) => {
          var response = this._memory.get(query);
          if (response) {
            emitResponse(new Response({data: response.data, params: response.params}));
          }

          cb();
        }
      },

      {
        to: Query.States.DONE,
        filter: (query, emitResponse, cb) => {
          var response = query.getFinalResponse();

          if (query.getAction() === Adapter.Actions.FETCH && response) {
            this._memory.set(query, response);
          }

          cb();
        }
      }
    ];
  }
});
