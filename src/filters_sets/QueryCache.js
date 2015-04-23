import FilterSet from '../core/FilterSet';
import Query from '../core/Query';

var QueryCache = FilterSet.extend({
  filters: [
    {
      to: Query.States.DONE,
      filter: (query, cb) => {
        console.log('in a filter!');
        cb();
      }
    }
  ]
});
