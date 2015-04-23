import OpticObject from './OpticObject';
import Response from './Response';
import FilterSet from './FilterSet';
import * as QueryTransforms from './QueryTransforms';
import * as Utils from './Utils';
import * as Hash from '../utils/Hash';

const States = {
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  DONE: 'done',
  CANCELED: 'canceled'
};

/**
 * The submission filter defines the default behavior of a query and it cannot be removed.
 */
const submissionFilterSet = FilterSet.extend({
  filters: [{
    to: States.SUBMITTING,
    filter: function(query, callback) {
      performSubmission.call(this, query, () => callback(States.DONE));
    }
  }]
});

const availableOptions = function() {
  return {
    action: null,
    params: {},
    data: {},
    parent: null,
    state: States.IDLE,
    adapter: null,
    filterSets: [new submissionFilterSet()],
    config: {}
  }
};

const Query = OpticObject.extend(Utils.extend(getQueryTransforms(), {
  init(ResourceClass, options = {}) {
    this._ResourceClass = ResourceClass;
    this._emittedResponses = [];
    this._constructOptions(availableOptions(), options);
    this._super();
  },

  /**
   * Creates a new query that resembles the attributes of this one however some fields
   * like _state, are not copied over, so this is more like a copy constructor than a
   * clone function.
   */
  copy() {
    return new Query(
      this._ResourceClass,
      this._deconstructOptions(Utils.omit(availableOptions(), 'state'))
    );
  },

  submit(onUpdate) {
    Utils.assert(this._state === States.IDLE,
        'A query can only be submitted from the IDLE state.');

    this._onUpdate = onUpdate;

    // Response with initial temporary response before all other work starts
    onUpdate(new Response());

    // Kick off the submission by starting a transition to the SUBMITTING state
    startStateTransitionTo(this, States.SUBMITTING);
  },

  getParams() {
    return this._params;
  },

  getData() {
    return this._data;
  },

  getAction() {
    return this._action;
  },

  getResourceClass() {
    return this._ResourceClass;
  },

  getResourceConfig() {
    return this._ResourceClass._config;
  },

  toString() {
    // var json
    // return `<Query:${hash}>`;
  },

  _getAdapter() {
    var AdapterClass = this._adapter || this._config.adapter || null;
    return AdapterClass ? new AdapterClass() : null;
  },

  /**
   * Get the value of `this` to bind to filter functions. Make sure to use this method to
   * get the context for every individual filter because of the embedded closure.
   */
  _getFilterContext() {
    var query = this;
    return {
      emitResponse: (() => {
        var hasEmitted = false;
        return function(response) {
          var responses = query._emittedResponses;

          // Only allow new responses until a final response has been seen.
          Utils.assert(responses.length === 0 || !Utils.last(responses).isFinal(), `
              This query cannot accept responses because a final response has already
              been emitted.
          `);

          // Discard the latest response from this filter upon a new one.
          if (hasEmitted) {
            responses.pop();
          }

          // Push the latest response from this filter.
          responses.push(response);
          hasEmitted = true;
        }
      })()
    };
  }
}), {States: States});

/**
 * Returns all the functions defined in QueryTransforms with the context bound to the
 * first argument.
 */
function getQueryTransforms() {
  return Utils.reduce(Utils.keys(QueryTransforms), (memo, name) => Utils.extend(memo, {
    [name]: function(...args) {
      return QueryTransforms[name].apply(null, [this].concat(args));
    }
  }), {});
}

/**
 * Change the state of the supplied query and call all necessary filters.
 */
function startStateTransitionTo(query, state, callback = Utils.noOp) {
  // Predicate helper to select filters that should be used for this transition.
  var predicate = f => (f.from ? f.from === query._state : true) &&
      (f.to ? f.to === state : true);

  // If the invoked filter specifies a state to transition to, then we stop
  // processing the list of filters for the current transition and immediately
  // start transitioning to the new state.
  var ifNewState = newState => startStateTransitionTo(query, newState, callback);

  var outboundFilters =
      Utils.flatten(Utils.map(query._filterSets, filterSet => filterSet.getOutboundFilters()));
  var inboundFilters =
      Utils.flatten(Utils.map(query._filterSets, filterSet => filterSet.getInboundFilters()));

  // Start by processing outbound filters.
  processFilters(
    query,
    Utils.select(outboundFilters, predicate),
    ifNewState,
    () => {
      // After all outbound filters have been processed, we can officially change the
      // _state property of this query and start processing inbound filters.
      query._state = state;
      processFilters(
        query,
        Utils.select(inboundFilters, predicate),
        ifNewState,
        callback
      );
    }
  );
}

/**
 * Recursive helper function to process a list of asynchronous filters and invoke the
 * callback when all filters are processed.
 */
function processFilters(query, filters, ifNewVal, callback = Utils.noOp) {
  var initialResponsesLength = query._emittedResponses.length;

  if (filters.length === 0) {
    // If no more filters to process, then we are done and invoke the callback.
    callback();
  } else {
    // Otherwise we invoke the first filter.
    filters[0].filter.call(query._getFilterContext(), query, newVal => {
      // Invoke the onUpdate function for the query if this filter emitted a response.
      if (query._emittedResponses.length !== initialResponsesLength) {
        Utils.assert(query._emittedResponses.length === initialResponsesLength + 1, `
            The length of the emitted responses array after the filter has completed
            must either be the same length as before the filter started, or greater
            by one. This error should never happen.
        `);
        query._onUpdate(Utils.last(query._emittedResponses));
      }

      if (newVal && ifNewVal) {
        // If the filter invokes the callback with a new value, and processFilters is
        // given a function to invoke in that situation, then do it.
        ifNewVal(newVal);
      } else {
        // Otherwise, recurse.
        processFilters(query, filters.slice(1), ifNewVal, callback);
      }
    });
  }
}

/**
 * Submit the query through the adapter. This is invoked with the context of the
 * submission filter.
 *
 * @param {Query} query
 * @param {function} callback - The callback to invoke when the submission is complete.
 */
function performSubmission(query, callback) {
  var adapter = query._getAdapter();
  Utils.assert(adapter, 'An adapter must be supplied before in order to submit a query.');

  adapter.submit(query, response => {
    this.emitResponse(response);
    callback();
  });
}

export default Query;
