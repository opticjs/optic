import OpticObject from './OpticObject';
import * as Utils from './Utils';

const Directions = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
};

const filterDefaults = {
  from: null,
  to: null,
  direction: Directions.INBOUND,
  filter: (query, cb) => cb()
};

export default OpticObject.extend('FilterSet', {
  queryFilters() {
    return [];
  },

  queryMethods() {
    return {};
  },

  getFinalFilters() {
    return Utils.map(this.queryFilters(), filter => Utils.extend(filterDefaults, filter));
  },

  getInboundFilters() {
    return Utils.select(this.getFinalFilters(), filter => filter.direction === Directions.INBOUND);
  },

  getOutboundFilters() {
    return Utils.select(this.getFinalFilters(), filter => filter.direction === Directions.OUTBOUND);
  },

  getResponseFilters() {
    return this.responseFilters && this.responseFilters() || [];
  }
}, {Directions: Directions, defaults: filterDefaults});
