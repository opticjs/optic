'use strict';

class Resource {
  constructor(attributes) {
    this._attributes = attributes;
  }

  get(key) {
    return this._attributes[key];
  }
}

module.exports = Resource;
