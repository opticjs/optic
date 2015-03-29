'use strict';

var OpticObject = require('./OpticObject');
var QueryTransforms = require('./QueryTransforms');
var Request = require('./Request');
var Resource = require('./Resource');
var Response = require('./Response');
var Utils = require('./Utils');

const States = {
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  DONE: 'done',
  CANCELED: 'canceled'
};

const availableOptions = {
  action: null,
  params: null,
  data: null,
  parent: null,
  state: null,
  adapter: null,
  inboundFilters: [mergeFilterDefaults(submissionFilter)],
  outboundFilters: [],
  isComposite: true,
  rangeStart: null,
  rangeLength: null,
  config: {}
};

const mergeFilterDefaults = filter => Utils.extend(filterDefaults, filter);
const filterDefaults = {
  from: null,
  to: null,
  composite: false,
  filter: (query, cb) => cb()
};

class Query extends OpticObject {
  constructor(ResourceClass, options = {}) {
    this._ResourceClass = ResourceClass;
    this._construct(availableOptions, options);
  }

  /**
   * Creates a new query that resembles the attributes of this one however some fields
   * like _state, are not copied over, so this is more like a copy constructor than a
   * clone function.
   */
  copy() {
    return new Query(this._ResourceClass, this._deconstruct(availableOptions));
  }

  submit(done) {
    Utils.invariant(this._state === States.IDLE,
        'A query can only submitted from the IDLE state');
    startStateTransitionTo(this, States.STARTING_SUBMISSION, done);
  }

  getParams() {
    return this._params;
  }

  getData() {
    return this._data;
  }

  getAction() {
    return this._action;
  }

  getResourceClass() {
    return this._ResourceClass;
  }

  getResourceConfig() {
    return this._ResourceClass._config;
  }
}

/**
 * The submission filter defines the default behavior of a query and it cannot be removed.
 */
var submissionFilter = {
  to: States.SUBMITTING,
  filter: (query, callback) => {
    performSubmission(query, () => callback(States.DONE));
  }
};

/**
 * Change the state of the supplied query and call all necessary filters.
 */
function startStateTransitionTo(query, state, callback) {
  // Predicate helper to select filters that should be used for this transition.
  var predicate = f => (f.from ? f.from === query._state : true) &&
      (f.to ? f.to === state : true) && f.composite === query._isComposite;

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
  if (filters.length === 0) {
    // If no more filters to process, then we are done and invoke the callback.
    callback();
  } else {
    // Otherwise we invoke the first filter.
    filters[0](query, newVal => {
      if (newVal && ifNewVal) {
        // If the filter invokes the callback with a new value, and processFilters is
        // given a function to invoke in that situation, then do it.
        ifNewVal(newVal);
      } else {
        // Otherwise, recurse.
        processFilters(query, filters.slice(1), callback);
      }
    })
  }
}

/**
 * Submit the query. Compisite queries will always submit by decomposing into and submitting
 * non composite queries. Non composite queries are always submitted through the adapter.
 */
function performSubmission(query, callback) {
  if (query._isComposite) {
    // Create an identical but non-composite query if the supplied query is composite.
    let newQuery = query.copy();
    newQuery._isComposite = false;

    // For now, we just submit the new query.
    // TODO: Make this support multiple sub queries, cursors, and stuff.
    newQuery.submit();
  } else {
    query._adapter.submit(query, callback);
  }
}

Query.States = States;
module.exports = Query;
