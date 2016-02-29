'use strict';

import Adapter from './Adapter';
import * as Utils from './Utils';

var Actions = Adapter.Actions;

export function parent(query, parent) {
  query.setProps({
    action: Actions.FETCH,
    parent: parent
  });
  return query;
}

export function key(query, key) {
  query.setProps({
    key: key
  });
  return query;
}

export function params(query, params) {
  query.setProps({
    params: params
  });
  return query;
}

export function fetch(query) {
  query.setProps({
    action: Actions.FETCH
  });
  return query;
}

export function update(query, data) {
  query.setProps({
    data: data,
    action: Actions.UPDATE
  });
  return query;
}

export function create(query, data) {
  query.setProps({
    data: data,
    action: Actions.CREATE
  });
  return query;
}

export function remove(query) {
  query.setProps({action: Actions.REMOVE});
  return query;
}

export function adapter(query, adapter) {
  query.setProps({adapter: adapter});
  return query;
}

export function filterSets(query, filterSets) {
  query.setProps({filterSets: filterSets});
}

export function addFilterSet(query, filterSet) {
  query._addFilterSet(filterSet);
  return query;
}

export function addFilterSets(query, filterSets = []) {
  Utils.each(filterSets, filterSet => {
    query._addFilterSet(filterSet);
  });
  return query;
}

export function removeFilterSet(query, filterSet) {
  query._removeFilterSet(filterSet);
  return query;
}

export function removeFilterSets(query, filterSets = []) {
  Utils.each(filterSets, filterSet => {
    query._removeFilterSet(filterSet);
  });
  return query;
}

export function sortQueryFilters(query, sortFn) {
  query.setProps({
    sortQueryFiltersFn: new OpticObject.Source(() => sortFn)
  });
  return query;
}

export function sortResponseFilters(query, sortFn) {
  query._sortResponseFiltersFn = sortFn;
  query.setProps({
    sortResponseFiltersFn: new OpticObject.Source(() => sortFn)
  });
  return query;
}
