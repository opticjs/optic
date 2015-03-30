'use strict';

import * as Utils from '../core/Utils';
import {ContentTypes} from './XHR';

// Just like the HttpRequest class, this class should be more robust. Charsets.
// Maybe multipart response body parsing.
export default class HttpResponse {
  constructor(xhr) {
    Utils.assert(
        xhr.readyState === 4,
        'An HttpResponse object must be instantiated with a completed XHR object.'
    );

    this._xhr = xhr;
    this.statusCode = xhr.status;
    this.statusText = xhr.statusText;
    this.text = xhr.responseText;
    this.headers = this._parseResponseHeaders();
    this.contentType = this._parseContentType();
    this.body = this._parseBody();
  }

  getHeader(field) {
    return this.headers[field.toLowerCase()];
  }

  _parseBody() {
    if (this.contentType === ContentTypes.json) {
      return JSON.parse(this.text);
    } else if (this.contentType === ContentTypes.form) {
      return Utils.reduce(
          this.text.split('&'),
          (memo, item) => Utils.extend(memo, {[item.split('=')[0]]: item.split('=')[1]}),
          {}
      );
    }
  }

  _parseContentType() {
    var type = this.getHeader('content-type');
    return type ? type.split('; ')[0] : null;
  }

  /**
   * This function is taken from https://gist.github.com/monsur/706839. Thanks Monsur!
   *
   * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
   * headers according to the format described here:
   * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
   * This method parses that string into a user-friendly key/value pair object.
   */
  _parseResponseHeaders() {
    var headerStr = this._xhr.getAllResponseHeaders();
    var headers = {};
    if (!headerStr) {
      return headers;
    }
    var headerPairs = headerStr.split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
      let headerPair = headerPairs[i];
      // Can't use split() here because it does the wrong thing
      // if the header value has the string ": " in it.
      let index = headerPair.indexOf('\u003a\u0020');
      if (index > 0) {
        let key = headerPair.substring(0, index).toLowerCase();
        let val = headerPair.substring(index + 2);
        headers[key] = val;
      }
    }
    return headers;
  }
}

