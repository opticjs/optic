'use strict';

import FilterSet from './core/FilterSet';
import HttpAdapter from './adapters/HttpAdapter';
import Query from './core/Query';
import Resource from './core/Resource';
import Response from './core/Response';
import OpticObject from './core/OpticObject';
import deepEqual from './core/deepEquals';
import * as Utils from './core/Utils';
import QueryCache from './filter_sets/QueryCache';
import QueryCombiner from './filter_sets/QueryCombiner';
import QueryThrottle from './filter_sets/QueryThrottle';
import RateLimitRetry from './filter_sets/RateLimitRetry';
import ResourceLinker from './filter_sets/ResourceLinker';
import FetchMemory from './filter_sets/FetchMemory';
import HashMap from './structs/HashMap';

export default {
  Resource: Resource,
  Query: Query,
  Response: Response,
  HttpAdapter: HttpAdapter,
  Utils: Utils,
  FilterSet: FilterSet,
  OpticObject: OpticObject,
  FilterSets: {
    QueryCache: QueryCache,
    QueryCombiner: QueryCombiner,
    QueryThrottle: QueryThrottle,
    RateLimitRetry: RateLimitRetry,
    ResourceLinker: ResourceLinker,
    FetchMemory: FetchMemory
  },
  Structs: {
    HashMap: HashMap
  },
  deepEqual: deepEqual
};
