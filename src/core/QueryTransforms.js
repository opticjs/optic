'use strict';

var Adapter = require('./Adapter');

var Actions = Adapter.Actions;

function all(query) {
  query._action = Actions.FETCH;
  query._rangeStart = 0;
  query._rangeLength = Infinity;
  return query;
}

function from(query, from) {
  query._action = Actions.FETCH;
  query._rangeStart = from;
  return query;
}

function count(query, count) {
  query._action = Actions.FETCH;
  query._rangeLength = count;
  return query;
}

function parent(query, parent) {
  query._action = Actions.FETCH;
  query._parent = parent;
  return query;
}

function params(query, params) {
  query._params = params;
  return query;
}

function update(query, data) {
  query._data = data;
  query._action = Actions.UPDATE;
  return query;
}

function create(query, data) {
  query._data = data;
  query._action = Actions.CREATE;
  return query;
}

function remove(query) {
  query._action = Actions.REMOVE;
  return query;
}

function inboundFilter(query, filter) {
  query._inboundFilters.unshift(mergeFilterDefaults(filter));
  return query;
}

function outboundFilter(query, filter) {
  query._outboundFilters.unshift(mergeFilterDefaults(filter));
  return query;
}

function composite(query, isComposite) {
  query._isComposite = isComposite;
  return query;
}

function adapter(query, adapter) {
  query._adapter = adapter;
  return query;
}

function config(query, config) {
  query._config = config;
  return query;
}

module.exports = {
  all: all,
  from: from,
  count: count,
  parent: parent,
  params: params,
  update: update,
  create: create,
  inboundFilter: inboundFilter,
  outboundFilter: outboundFilter,
  composite: composite,
  adapter: adapter
};
