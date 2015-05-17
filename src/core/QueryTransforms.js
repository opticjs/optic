'use strict';

import Adapter from './Adapter';
import * as Utils from './Utils';

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

export function adapter(query, adapter) {
  query._adapter = adapter;
  return query;
}

export function addFilterSet(query, filterSet) {
  query._addFilterSet(filterSet);
  return query;
}

export function removeFilterSet(query, filterSet) {
  query._removeFilterSet(filterSet);
  return query;
}

export function filterSets(query, filterSets) {
  query._filterSets = Utils.flatten(filterSets, query._filterSets);
}
