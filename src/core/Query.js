import OpticObject from './OpticObject';
import Response from './Response';
import * as QueryTransforms from './QueryTransforms';
import * as Utils from './Utils';

const States = {
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  DONE: 'done',
  CANCELED: 'canceled'
};

const Scopes = {
  ALL: 'all',
  COMPOSITE: 'composite',
  LEAF: 'leaf'
};

const mergeFilterDefaults = filter => Utils.extend(filterDefaults, filter);
const availableOptions = function() {
  return {
    action: null,
    params: null,
    data: null,
    parent: null,
    state: States.IDLE,
    adapter: null,
    inboundFilters: [mergeFilterDefaults(submissionFilter)],
    outboundFilters: [],
    isComposite: true,
    rangeStart: null,
    rangeLength: null,
    config: {},
    _statusMergeFn: (resp1, resp2) => resp2.status,
    _paramsMergeFn: (resp1, resp2) => Utils.extend(resp1.params, resp2.params),
    _dataMergeFn: (resp1, resp2) => resp1.data.concat(resp2.data)
  }
};

const filterDefaults = {
  from: null,
  to: null,
  scope: Scopes.LEAF,
  filter: (query, cb) => cb()
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

  getOutboundFilters() {
    return this._outboundFilters;
  },

  getInboundFilters() {
    return this._inboundFilters;
  },

  isRangeQuery() {
    return !(Utils.isUndefined(this._rangeStart) && Utils.isUndefined(this._rangeLength));
  },

  _getAdapter() {
    return this._adapter || this._config.adapter || null;
  },

  _getNextParams() {
    return this._nextParams || this._config.nextParams || null;
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
 * The submission filter defines the default behavior of a query and it cannot be removed.
 */
var submissionFilter = {
  to: States.SUBMITTING,
  scope: Scopes.ALL,
  filter: function(query, callback) {
    performSubmission.call(this, query, () => callback(States.DONE));
  }
};

/**
 * Change the state of the supplied query and call all necessary filters.
 */
function startStateTransitionTo(query, state, callback = Utils.noOp) {
  // Predicate helper to select filters that should be used for this transition.
  var predicate = f => (f.from ? f.from === query._state : true) &&
      (f.to ? f.to === state : true) &&
      (f.scope === Scopes.ALL ||
          ((f.scope === Scopes.COMPOSITE) === query._isComposite));

  // If the invoked filter specifies a state to transition to, then we stop
  // processing the list of filters for the current transition and immediately
  // start transitioning to the new state.
  var ifNewState = newState => startStateTransitionTo(query, newState, callback);

  // Start by processing outbound filters.
  processFilters(
    query,
    Utils.select(query.getOutboundFilters(), predicate),
    ifNewState,
    () => {
      // After all outbound filters have been processed, we can officially change the
      // _state property of this query and start processing inbound filters.
      query._state = state;
      processFilters(
        query,
        Utils.select(query.getInboundFilters(), predicate),
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
 * Submit the query. Compisite queries will always submit by decomposing into and submitting
 * non composite queries. Non composite queries are always submitted through the adapter.
 * This is invoked with the context of the submission filter.
 *
 * @param {Query} query
 * @param {function} callback - The callback to invoke when the submission is complete.
 */
function performSubmission(query, callback) {
  if (query._isComposite) {
    // Create an identical but non-composite query if the supplied query is composite.
    let newQuery = query.copy();
    newQuery._isComposite = false;

    // Submit the initial decomposed query.
    newQuery.submit(response => {
      if (response.isFinal()) {
        // Always emit a new response once the initial decomposed query completes.
        this.emitResponse(response);

        if (query.isRangeQuery() && response.isSuccessful()) {
          // If this is a range query and the previous query was successful, then we have
          // to check if additional queries are required to get all the requested data.
          let remainder = query._rangeLength - response.data.length;
          if (remainder > 0) {
            console.log(remainder);
            getNextQuery(query, response, remainder).submit(nextResponse => {
              // Once the next query responds, we merge that response with the response of
              // the first decomposed query and emit the merged response as the final one.
              if (nextResponse.isFinal()) {
                this.emitResponse(new Response({
                  status: query._statusMergeFn(response, nextResponse),
                  params: query._paramsMergeFn(response, nextResponse),
                  data: query._dataMergeFn(response, nextResponse)
                }));
                callback();
              }
            });
          } else {
            console.log('hi');
            callback();
          }
        } else {
          // Otherwise, we can invoke the completed callback immediately.
          callback();
        }
      }
    });
  } else {
    query._getAdapter().submit(query, response => {
      this.emitResponse(response);
      callback();
    });
  }
}

/**
 * Given a leaf query and it's response, construct and return a composite query that
 * represents the next page of results.
 */
function getNextQuery(query, response, remainder) {
  var nextQuery = query.copy().from(query._rangeStart + remainder).count(remainder);
  if (query._getNextParams()) {
    return nextQuery.params(Utils.extend(
        query.getParams(),
        query._getNextParams()(query, response)
    ));
  }
}

export default Query;
