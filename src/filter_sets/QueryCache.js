import deepEqual from '../core/deepEquals';
import FilterSet from '../core/FilterSet';
import HashMap from '../structs/HashMap';
import Query from '../core/Query';

/**
 * Saves a reference to every response that passes through this filter, keyed by the toString()
 * of the associated query.
 */
export default FilterSet.extend('QueryCache', {
  init() {
    this._responses = new HashMap(deepEqual);
  },

  queryFilters() {
    return [
      {
        from: Query.States.IDLE,
        to: Query.States.SUBMITTING,
        filter: (query, emitResponse, cb) => {
	  this._responses.has(query);
          var response = this._responses.get(query);
	  console.log('response');
	  console.log(response);

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
          var response = query.getFinalResponse();

	  // console.log('sup');
	  // console.log(!this._responses.has(query) && response);

          if (!this._responses.has(query) && response) {
	    console.log('setting now');
            this._responses.set(query, response);
          }

          cb();
        }
      }
    ];
  }
});
