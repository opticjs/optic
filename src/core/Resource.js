'use strict';

const States = {
  NEW: 'NEW',
  READY: 'READY',
  LOADING: 'LOADING',
  ERROR: 'ERROR',
  EMPTY: 'EMPTY'
};

class Resource {
  constructor(attributes, state) {
    this._attributes = attributes;
    this._state = state;
  }

  get(key) {
    return this._attributes[key];
  }

  getState() {
    return this._state;
  }
}

Resource.States = States;

module.exports = Resource;
