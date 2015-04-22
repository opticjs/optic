'use strict';

import * as Utils from './Utils';
import OpticObject from './OpticObject';

/**
 * Responses are emitted by a query. A single query can emit multiple "temporary" responses
 * followed by one "final" response. Temporary responses are useful for communicating the
 * progress of the query to the user.
 */
export default OpticObject.extend({

  /**
   * @param {Object} [options={}]
   * @param {number} [options.status] - The status code of this response. The response is
   *     considered to be final iff the status is specified.
   * @param {Object} [options.params] - Params are metadata associated with the response.
   * @param {(Resource|Resource[])} [options.data] - The main data returned by this response.
   *     Either a single resource or an array of resources, depending on the query type.
   */
  init(options = {}) {
    Utils.assert(Utils.isUndefined(options.status) || Utils.isNumber(options.status),
        'status must be either a number or undefined');

    this.status = options.status;
    this.params = options.params;
    this.data = options.data;
  },

  /**
   * If there is no status, then this response is temporary and another response can be
   * expected to be emitted by the query. Otherwise the response is final.
   *
   * @return {boolean} - Whether this response is considered to be final.
   */
  isFinal() {
    return !Utils.isUndefined(this.status);
  },

  /**
   * A response is successful if it has a 2xx status code. This method always returns false
   * for temporary responses.
   *
   * @return {boolean} - Whether this response has a successful status code.
   */
  isSuccessful() {
    return Utils.isNumber(this.status) && this.status >= 200 && this.status < 300;
  }
}, {OK: 200, ERROR: 0});
