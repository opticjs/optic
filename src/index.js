'use strict';

var createResourceClass = require('./core/createResourceClass');
var Query = require('./core/Query');
var Resource = require('./core/Resource');
var Request = require('./Request');
var Response = require('./Response');

var Optic = {
  createResourceClass: createResourceClass,
  Query: Query,
  Request: Request,
  Response: Response
};

module.exports = Optic;
