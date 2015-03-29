'use strict';

var Adapter = require('../core/Adapter');
var HttpRequest = require('../http/HttpRequest');
var HttpResponse = require('../http/HttpResponse');
var Response = require('../core/Response');
var URLBuilder = require('../utils/URLBuilder');

const availableOptions = {
  url: {},
  headers: {},
  parseData: defaultDataParser,
  parseParams: (httpResponse, query) => {}
};

class HttpAdapter extends Adapter {
  constructor(options) {
    this._construct(availableOptions, options);
  }

  create(query, callback) {
    var request = HttpRequest
        .post(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.status,
        params: this._parseParams(httpResponse, query),
        data: this._parseData(httpResponse, query)
      }));
    });
  }

  update(query, callback) {
    var request = HttpRequest
        .put(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.status,
        params: this._parseParams(httpResponse, query),
        data: this._parseData(httpResponse, query)
      }));
    });
  }

  remove(query, callback) {
    var request = HttpRequest
        .delete(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.status,
        params: this._parseParams(httpResponse, query)
      }));
    });
  }

  fetch(query, callback) {
    var request = HttpRequest
        .get(this._buildURL(query))
        .headers(this._headers)
        .data(query.getData());

    send(request, callback, httpResponse => {
      callback(new Response({
        status: httpResponse.status,
        params: this._parseParams(httpResponse, query),
        data: this._parseData(httpResponse, query)
      }));
    });
  }

  _buildURL(query) {
    var url = Utils.isFunction(url) ? url(query) : this._url;
    return Utils.isString(url) ? url : URLBuilder.build(url);
  }
}

function send(request, queryCallback, success) {
  try {
    request.send(cb);
  } catch (e) {
    if (e instanceof HttpRequest.Error) {
      queryCallback(new Response({status: Response.ERROR}));
    } else {
      throw e;
    }
  }
}

function defaultDataParser(httpResponse, query) {
  var data = httpResponse.data,
      ResourceClass = query.getResourceClass(),
      transform = o => new ResourceClass(o);
  return Utils.isArray(data) ? Utils.map(data, transform) : transform(data);
}

module.exports = HttpAdapter;
