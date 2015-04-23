'use strict';

import Adapter from '../core/Adapter';
import HttpRequest from '../http/HttpRequest';
import HttpResponse from '../http/HttpResponse';
import Response from '../core/Response';
import URLBuilder from '../utils/URLBuilder';
import * as Utils from '../core/Utils';

export default Adapter.extend({
  init(options) {
    this._super(options);
  },

  create(query, callback) {
    var request = new HttpRequest()
        .post(this._buildURL(query))
        .headers(this._getHeaders())
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this.parseParams(httpResponse, query),
        data: this.parseData(httpResponse, query)
      }));
    });
  },

  update(query, callback) {
    var request = new HttpRequest()
        .put(this._buildURL(query))
        .headers(this._getHeaders())
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this.parseParams(httpResponse, query),
        data: this.parseData(httpResponse, query)
      }));
    });
  },

  remove(query, callback) {
    var request = new HttpRequest()
        .del(this._buildURL(query))
        .headers(this._getHeaders())
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this.parseParams(httpResponse, query)
      }));
    });
  },

  fetch(query, callback) {
    var request = new HttpRequest()
        .get(this._buildURL(query))
        .headers(this._getHeaders())
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this.parseParams(httpResponse, query),
        data: this.parseData(httpResponse, query)
      }));
    });
  },

  parseData: defaultDataParser,

  parseParams: (httpResponse, query) => {{}},

  _buildURL(query) {
    Utils.assert(
        !Utils.isUndefined(this.url),
        'Subclasses of HttpAdapter must define the `url` property.'
    );
    var url = Utils.isFunction(this.url) ? this.url(query) : this.url;
    return Utils.isString(url) ? url : URLBuilder.build(url);
  },

  _getHeaders(query) {
    if (this.headers) {
      return Utils.isString(this.headers) ? this.headers : this.headers(query);
    } else {
      return {};
    }
  }
});

function send(request, queryCallback, success) {
  try {
    request.submit(success);
  } catch (e) {
    if (e instanceof HttpRequest.HttpRequestError) {
      console.error(e);
      queryCallback(new Response({status: Response.ERROR}));
    } else {
      throw e;
    }
  }
}

function defaultDataParser(httpResponse, query) {
  var data = httpResponse.body,
      ResourceClass = query.getResourceClass(),
      transform = o => new ResourceClass(o);
  return Utils.isArray(data) ? Utils.map(data, transform) : transform(data);
}
