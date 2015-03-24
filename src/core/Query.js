'use strict';

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

class Query {
  constructor(resourceConfig) {
    this._resourceConfig = resourceConfig;
    this._state = States.IDLE;
    this._inboundQueryFilters = [];
    this._outboundQueryFilters = [];
    this._requestFilters = [];
    this._responseFilters = [];

    // Setup default filter
    this.addInboundQueryFilter(submissionQueryFilter);
  }

  submit(done) {
    Utils.invariant(this.getState() === States.IDLE,
        'A query can only submitted from the IDLE state');
    this._startStateTransitionTo(States.STARTING_SUBMISSION);
  }

  getState() {
    return this._state;
  }

  addInboundQueryFilter(filter) {
    this._inboundQueryFilters.unshift(filter);
  }

  removeInboundQueryFilter(filter) {
    // TODO: Implement method
  }

  addOutboundQueryFilter(filter) {
    this._outboundQueryFilters.unshift(filter);
  }

  removeOutboundQueryFilter(filter) {
    // TODO: Implement method
  }

  addRequestFilter(filter) {
  }

  removeRequestFilter(filter) {
    // TODO: Implement method
  }

  addResponseFilter(filter) {
  }

  removeResponseFilter(filter) {
    // TODO: Implement method
  }

  _startStateTransitionTo(state) {
    // Predicate helper to select filters that should be used for this transition.
    var predicate = f => (f.from ? f.from === this.getState() : true) &&
        (f.to ? f.to === state : true);

    // If the invoked filter specifies a state to transition to, then we stop
    // processing the list of filters for the current transition and immediately
    // start transitioning to the new state.
    var ifNewState = newState => this._startStateTransitionTo(newState);

    // Start by processing outbound filters.
    processFilters(
      Utils.select(this._outboundQueryFilters, predicate),
      ifNewState,
      () => {
        // After all outbound filters have been processed, we can officially change the
        // _state property of this query and start processing inbound filters.
        this._state = state;
        processFilters(Utils.select(this._inboundQueryFilters, predicate), ifNewState);
      }
    );
  }
}

/**
 * The submission filter defines the default behavior of a query and it cannot be removed.
 */
var submissionQueryFilter = {
  from: null,
  to: States.SUBMITTING,
  filter: (query, callback) => {
    performSubmission(query, () => callback(States.DONE));
  }
};

/**
 * Recursive helper function to process a list of asynchronous filters and invoke the
 * callback when all filters are processed.
 */
function processFilters(filters, ifNewVal, callback = Utils.noOp) {
  if (filters.length === 0) {
    // If no more filters to process, then we are done and invoke the callback.
    callback();
  } else {
    // Otherwise we invoke the first filter.
    filters[0](this, newVal => {
      if (newVal && ifNewVal) {
        // If the filter invokes the callback with a new value, and processFilters is
        // given a function to invoke in that situation, then do it.
        ifNewVal(newVal);
      } else {
        // Otherwise, recurse.
        processFilters(filters.slice(1), callback);
      }
    })
  }
}

/**
 * Submit the query by sending one or more Request objects.
 */
function performSubmission(query, callback) {

}

Query.States = States;
module.exports = Query;
