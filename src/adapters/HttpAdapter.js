'use strict';

import Adapter from '../core/Adapter';
import HttpRequest from '../http/HttpRequest';
import HttpResponse from '../http/HttpResponse';
import Response from '../core/Response';
import URLBuilder from '../utils/URLBuilder';
import * as Utils from '../core/Utils';

const availableOptions = {
  url: {},
  headers: {},
  parseData: defaultDataParser,
  parseParams: (httpResponse, query) => {}
};

export default Adapter.extend({
  init(options) {
    this._constructOptions(availableOptions, options);
    this._super(options);
  },

  create(query, callback) {
    var request = new HttpRequest()
        .post(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this._parseParams(httpResponse, query),
        data: this._parseData(httpResponse, query)
      }));
    });
  },

  update(query, callback) {
    var request = new HttpRequest()
        .put(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this._parseParams(httpResponse, query),
        data: this._parseData(httpResponse, query)
      }));
    });
  },

  remove(query, callback) {
    var request = new HttpRequest()
        .del(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this._parseParams(httpResponse, query)
      }));
    });
  },

  fetch(query, callback) {
    var request = new HttpRequest()
        .get(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.statusCode,
        params: this._parseParams(httpResponse, query),
        data: this._parseData(httpResponse, query)
      }));
    });
  },

  _buildURL(query) {
    var url = Utils.isFunction(url) ? url(query) : this._url;
    return Utils.isString(url) ? url : URLBuilder.build(url);
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
