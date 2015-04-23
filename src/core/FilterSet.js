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

var FilterSet = OpticObject.extend({
  filters: [],

  getFinalFilters() {
    return Utils.map(this.filters, filter => Utils.extend(filterDefaults, filter));
  },

  getInboundFilters() {
    return Utils.select(this.getFinalFilters(), filter => filter.direction === Directions.INBOUND);
  },

  getOutboundFilters() {
    return Utils.select(this.getFinalFilters(), filter => filter.direction === Directions.OUTBOUND);
  }
}, {Directions: Directions, defaults: filterDefaults});

export default FilterSet;
