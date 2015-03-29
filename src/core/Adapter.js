'use strict';

var OpticObject = require('./OpticObject');

var Actions = {
  CREATE: 'create',
  UPDATE: 'update',
  REMOVE: 'remove',
  FETCH: 'fetch'
};

class Adapter extends OpticObject {
  constructor(options) {
    this._options = options;
  }

  submit(query, callback) {
    this[query._action](query, callback);
  }
}

Adapter.Actions;
module.exports = Adapter;
