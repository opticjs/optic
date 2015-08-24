'use strict';

import * as Utils from './Utils';
import OpticObject from './OpticObject';

const availableOptions = function() {
  return {
    data: null,
    status: null,
    params: {}
  };
};

/**
 * Responses are emitted by query filters and and passed through to the query submission
 * callbacks. A response *should not* have a reference to the query that triggered it.
 */
export default OpticObject.extend('Response', {

  /**
   * @param {Object} [options={}]
   * @param {number} [options.status] - The status code of this response.
   * @param {Object} [options.params] - Params are metadata associated with the response.
   * @param {(Resource|Resource[])} [options.data] - The main data returned by this response.
   *     Either a single resource or an array of resources, depending on the query type.
   */
  init(options = {}) {
    this._constructOptions(availableOptions(), options);
    this._super();

    // Public fields
    this.status = this._status;
    this.data = this._data;
    this.params = this._params;
  },

  /**
   * A response is successful if it has a 2xx status code.
   *
   * @return {boolean} - Whether this response has a successful status code.
   */
  isSuccessful() {
    return Utils.isNumber(this.status) && this.status >= 200 && this.status < 300;
  },

  /**
   * Provisional responses can be emitted by query filters to post progress about a query
   * before it is complete. To create a provisional response just create a response with a
   * null status.
   */
  isProvisional() {
    return this.status == null;
  }
}, {OK: 200, ERROR: 0, CANCELED: -1});
