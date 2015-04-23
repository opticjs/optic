'use strict';

import Adapter from './Adapter';
var Actions = Adapter.Actions;

export function parent(query, parent) {
  query._action = Actions.FETCH;
  query._parent = parent;
  return query;
}

export function params(query, params) {
  query._params = params;
  return query;
}

export function fetch(query) {
  query._action = Actions.FETCH;
  return query;
}

export function update(query, data) {
  query._data = data;
  query._action = Actions.UPDATE;
  return query;
}

export function create(query, data) {
  query._data = data;
  query._action = Actions.CREATE;
  return query;
}

export function remove(query) {
  query._action = Actions.REMOVE;
  return query;
}

export function inboundFilter(query, filter) {
  query._inboundFilters.unshift(mergeFilterDefaults(filter));
  return query;
}

export function outboundFilter(query, filter) {
  query._outboundFilters.unshift(mergeFilterDefaults(filter));
  return query;
}

export function adapter(query, adapter) {
  query._adapter = adapter;
  return query;
}

export function config(query, config) {
  query._config = config;
  return query;
}

export function nextParams(nextParamsFn) {
  query._nextParams = nextParamsFn;
  return query;
}
