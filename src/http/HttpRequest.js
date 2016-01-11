'use strict';

import * as Utils from '../core/Utils';
import {buildXHR, Methods, ContentTypes} from './XHR';
import HttpResponse from './HttpResponse';

const RequestStates = {
  IDLE: 'IDLE',
  REQUESTING: 'REQUESTING',
  COMPLETE: 'COMPLETE'
};

// TODO: This file is pretty minimal at the moment. It could use some improvements like
// making sure invalid states can't be reached and general sanity checking. This class
// should be a bulletproof Brinks truck. Right now it's a smart car:
// http://ecogeek.org/wp-content/uploads/2006/07/electric_smart_car.jpg

export default class HttpRequest {
  constructor() {
    this._id = Utils.uid();
    this._xhr = buildXHR();
    this._state = RequestStates.IDLE;

    Utils.assert(!!this._xhr, 'This browser does not support ajax');
  }

  get(url) {
    this._method = Methods.GET;
    this._url = url;
    return this;
  }

  post(url) {
    this._method = Methods.POST;
    this._url = url;
    return this;
  }

  put(url) {
    this._method = Methods.PUT;
    this._url = url;
    return this;
  }

  del(url) {
    this._method = Methods.PUT;
    this._url = url;
    return this;
  }

  head(url) {
    this._method = Methods.PUT;
    this._url = url;
    return this;
  }

  data(data) {
    if (Utils.isObject(data)) {
      this._inferredType = ContentTypes.json;
    }

    this._dataCalls = this._dataCalls || [];
    this._dataCalls.push(data);
    return this;
  }

  headers(headers) {
    this._headers = Utils.extend(this._headers || {}, headers);
    return this;
  }

  accept(acceptType) {
    this._acceptType = acceptType;
    return this;
  }

  type(type) {
    this._type = ContentTypes[type] || type;
    return this;
  }

  submit(callback) {
    Utils.assert(
        !Utils.isUndefined(this._url),
        'Please specify a URL using one of the following methods: get, post, put, del, head.'
    );

    this._state = RequestStates.REQUESTING;
    this._xhr.open(this._method, this._url, true);
    Utils.each(this._computeHeaders(), (val, key) => {
      this._xhr.setRequestHeader(key, val);
    });

    this._xhr.onreadystatechange = () => {
      if (this._xhr.readyState === 4) {
        this._state = RequestStates.COMPLETE;
        callback(new HttpResponse(this._xhr));
      }
    };

    try {
      this._shouldSendData() ? this._xhr.send(this._computeDataString()) : this._xhr.send();
    } catch (e) {
      this._state = RequestStates.COMPLETE;
      throw new HttpRequestError();
    }
  }

  _computeHeaders() {
    var type = this._computeContentType();
    return Utils.extend(
        type ? {'Content-Type': type} : {},
        this._acceptType ? {'Accept': this._acceptType} : {},
        this._headers || {}
    );
  }

  _computeContentType() {
    return this._headers['Content-Type'] || this._type || this._inferredType;
  }

  _computeDataString() {
    if (this._dataCalls.length > 0) {
      let fullData;
      if (Utils.isObject(this._dataCalls[0])) {
        // If the first data call is an object, we assume all of them are and merge all
        // objects into one before encoding the data into a data string.
        fullData = Utils.merge(this._dataCalls);
      } else {
        // Otherwise we join all data calls with an amperstand with the assumption that
        // they are parts of a form encoded data string, such as "key1=val1".
        fullData = this._dataCalls.join('&');
      }

      if (this._computeContentType() === ContentTypes.json && Utils.isObject(fullData)) {
        return JSON.stringify(fullData);
      } else if (this._computeContentType() === ContentTypes.form && Utils.isObject(fullData)) {
        return Utils.map(Utils.keys(fullData), key => key + '=' + fullData[key]).join('&');
      } else {
        return fullData;
      }
    } else {
      return '';
    }
  }

  _shouldSendData() {
    return Utils.contains([Methods.POST, Methods.PUT], this._method);
  }
}

class HttpRequestError extends Error {
}

HttpRequest.HttpRequestError = HttpRequestError;
