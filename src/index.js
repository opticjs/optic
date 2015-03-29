'use strict';

import createResourceClass from './core/createResourceClass';
import HttpAdapter from './adapters/HttpAdapter';
import Query from './core/Query';
import Resource from './core/Resource';
import Response from './core/Response';

// import Query from './core/Query';

export default {
  createResourceClass: createResourceClass,
  Query: Query,
  Response: Response,
  HttpAdapter: HttpAdapter
};

// module.exports = Optic;
