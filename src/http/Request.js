'use strict';

var Utils = require('../core/utils');
var XHR = require('./XHR');

var Methods = XHR.Methods;

class Request {
  constructor() {
    this._id = Utils.uid();
    this._xhr = new XHR();
  }

  get(url) {
    this._method = Methods.GET;
    this._url = url;
  }

  post(url) {
    this._method = Methods.POST;
    this._url = url;
  }

  put(url) {
    this._method = Methods.PUT;
    this._url = url;
  }

  del(url) {
    this._method = Methods.PUT;
    this._url = url;
  }

  head(url) {
    this._method = Methods.PUT;
    this._url = url;
  }

  send(data) {
    this._data = Utils.extend(this._data || {}, data);
  }

  set(headers) {
    this._headers = Utils.extend(this._headers || {}, data);
  }

  submit() {
  }
}

module.exports = Request;
