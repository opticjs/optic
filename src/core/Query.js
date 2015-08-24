import OpticObject from './OpticObject';
import Response from './Response';
import FilterSet from './FilterSet';
import * as Logger from './Logger';
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
const SubmissionFilterSet = FilterSet.extend('SubmissionFilterSet', {
  queryFilters() {
    return [{
      to: States.SUBMITTING,
      filter: function(query, emitResponse, callback) {
        performSubmission.call(this, query, emitResponse, () => callback(States.DONE));
      }
    }];
  }
});
const submissionFilterSet = new SubmissionFilterSet();

const availableOptions = function() {
  return {
    action: null,
    params: {},
    data: {},
    parent: null,
    state: States.IDLE,
    adapter: null,
    filterSets: [],
    sortQueryFiltersFn: (filters, fromState, toState) => filters,
    sortResponseFiltersFn: filters => filters
  }
};

const Query = OpticObject.extend('Query', Utils.extend(getQueryTransforms(), {
  init(ResourceClass, options = {}) {
    this._ResourceClass = ResourceClass;
    this._responses = [];
    this._constructOptions(availableOptions(), options);
    this._super();

    // Setup default query config options.
    var config = ResourceClass.getConfig();

    // Add additional filter sets from the resource config.
    if (config.filterSets) {
      Utils.each(config.filterSets, filterSet => this._addFilterSet(filterSet));
    }

    // Set the adapter if it's specified in the resource config but it doesn't exist
    // on the object yet.
    if (config.adapter && !this._adapter) {
      this._adapter = config.adapter;
    }

    // Set of filter functions that are considered disabled by this query.
    this._disabledFilterFns = new WeakSet();

    // Either null or a reference to the current query filter function being run.
    this._currentQueryFilterFn = null;

    // Timestamp
    this.submittedAt = null;
  },

  clone() {
    return new Query(
      this._ResourceClass,
      this._deconstructOptions(availableOptions())
    );
  },

  submit(onComplete, onUpdate = null) {
    Utils.assert(this._state === States.IDLE,
        'A query can only be submitted from the IDLE state.');

    this._onQueryComplete = onComplete;
    this._onQueryUpdate = onUpdate;

    // Response with initial temporary response before all other work starts
    this._registerResponse(new Response());

    this.submittedAt = new Date().getTime();

    // Kick off the submission by starting a transition to the SUBMITTING state. When this
    // operation completes, the state that the query lands on is NOT guaranteed to be the
    // destination state that we specify in this function call.
    startStateTransitionTo(this, States.SUBMITTING, () => {
      // The filter chain has completed and the query is considered done. The filters should
      // have emitted at least one non-provisional response. The latest one of these will be
      // used as the final response and sent to the main query completion callback.
      var finalResponse = null;
      Utils.each(this.getResponses(), response => {
        if (!response.isProvisional()) {
          finalResponse = response;
        }
      });

      // We're done!
      if (finalResponse) {
        this._onQueryComplete(finalResponse);
      }
    });
  },

  getParams() {
    return this._params;
  },

  replaceParams(params) {
    this._params = params;
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

  getFinalResponse() {
    var response = Utils.last(this._responses);
    return response && !response.isProvisional() ? response : null;
  },

  getLatestResponse() {
    return Utils.last(this._responses) || null;
  },

  getFilterSets() {
    return Utils.union(this._filterSets, this._ResourceClass.getConfig().filterSets || []);
  },

  getResponses() {
    return this._responses;
  },

  _getSortedResponseFilters() {
    return this._sortResponseFiltersFn(Utils.flatten(Utils.map(
        this.getFilterSets(),
        filterSet => filterSet.getResponseFilters()
    )));
  },

  _getSortedQueryFiltersForTransition(fromState, toState) {
    var getFilters = mapFn => Utils.select(
        this._sortQueryFiltersFn(
            Utils.flatten(Utils.map(this._getEffectiveFilterSets(), mapFn)),
            fromState,
            toState
        ),
        f => (f.from ? f.from === fromState : true) && (f.to ? f.to === toState : true)
    );

    return {
      inbound: getFilters(filterSet => filterSet.getInboundFilters()),
      outbound: getFilters(filterSet => filterSet.getOutboundFilters()),
    };
  },

  toString(includeState = true) {
    return this._super(Utils.union(
        ['_action', '_params', '_data', '_filterSets', '_adapter', '_parent'],
        includeState ? ['_state'] : []
    ));
  },

  _getAdapterInstance() {
    var AdapterClass = this._adapter || null;
    return AdapterClass ? new AdapterClass() : null;
  },

  _getEffectiveFilterSets() {
    return Utils.flatten([this._filterSets, [submissionFilterSet]]);
  },

  _addFilterSet(filterSet) {
    this._filterSets = Utils.union(this._filterSets, [filterSet]);
  },

  _removeFilterSet(filterSet) {
    this._filterSets = Utils.without(this._filterSets, filterSet);
  },

  /**
   * Run the response through all filters and add it to the stack of responses for this query.
   */
  _registerResponse(response) {
    response.requestedAt = this.submittedAt;

    Utils.each(this._getSortedResponseFilters(), filter => {
      if (response) {
        response = filter(response);
      }
    });

    if (response) {
      this._responses.push(response);
      this._onQueryUpdate && this._onQueryUpdate(response);
    }
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
  // If the invoked filter specifies a state to transition to, then we stop
  // processing the list of filters for the current transition and immediately
  // start transitioning to the new state.
  var ifNewState = newState => startStateTransitionTo(query, newState, callback);

  var queryFilters = query._getSortedQueryFiltersForTransition(query._state, state);

  // Start by processing outbound filters.
  processFilters(
    query,
    queryFilters.outbound,
    ifNewState,
    () => {
      // After all outbound filters have been processed, we can officially change the
      // _state property of this query and start processing inbound filters.
      query._state = state;
      processFilters(
        query,
        queryFilters.inbound,
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
  var initialResponsesLength = query._responses.length;

  if (filters.length === 0) {
    // If no more filters to process, then we are done and invoke the callback.
    callback();
  } else {
    // Otherwise we invoke the first filter.
    let firstFilter = filters[0];
    let filterFn = (...args) => firstFilter.filter(...args);
    query._currentQueryFilterFn = filterFn;
    filterFn.call(null, query, (r) => query._registerResponse(r), newVal => {
      // Do nothing if this filter fn has been disabled.
      if (query._disabledFilterFns.has(filterFn)) {
        return;
      }

      if (query._currentQueryFilterFn === filterFn) {
        // If this is the first time that this callback is being invoked, then all is well.
        // Reset _currentQueryFilterFn and carry on.
        query._currentQueryFilterFn = null;
      } else if (newVal) {
        // Otherwise the filter is requesting to interrupt the current query filter processing
        // queue and start a new path instead. Whichever filter function that is currently
        // running will be listed as disabled so that any response emissions or newVals will
        // be ignored.
        if (query._currentQueryFilterFn) {
          query._disabledFilterFns.add(query._currentQueryFilterFn);
        }

        ifNewVal(newVal);
        return;
      } else {
        throw new Error(`Missing destination state. Only the first invocation of a query \
filter callback may omit the destination state argument.`);
      }

      if (newVal) {
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
function performSubmission(query, emitResponse, callback) {
  var adapter = query._getAdapterInstance();
  Utils.assert(adapter, 'An adapter is required to submit a query.');

  adapter.submit(query, response => {
    emitResponse(response);
    callback();
  });
}

export default Query;
