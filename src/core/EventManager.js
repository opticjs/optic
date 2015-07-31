'use strict';

/**
 * Provides an interface for listening to and triggering events. All Optic classes extend
 * from this class.
 */

export default class EventManager {
  constructor() {
    this._events = {};
  }
}

EventManager.prototype.on = function(event, callback, context) {
};

EventManager.prototype.off = function(event, callback) {
};

EventManager.prototype.trigger = function(event, ...args){
};
