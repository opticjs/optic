'use strict';

export default class Resource {
  constructor(attributes) {
    this._attributes = attributes;
  }

  get(key) {
    return this._attributes[key];
  }
}
