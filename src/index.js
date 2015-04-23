'use strict';

import HttpAdapter from './adapters/HttpAdapter';
import Query from './core/Query';
import Resource from './core/Resource';
import Response from './core/Response';

export default {
  Resource: Resource,
  Query: Query,
  Response: Response,
  HttpAdapter: HttpAdapter
};
