'use strict';

import OpticObject from './OpticObject';

var Actions = {
  CREATE: 'create',
  UPDATE: 'update',
  REMOVE: 'remove',
  FETCH: 'fetch'
};

export default OpticObject.extend('Adapter', {
  init(options) {
    this._super(options);
  },

  submit(query, callback) {
    this[query._action](query, callback);
  }
}, {Actions: Actions});
