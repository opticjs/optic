import FilterSet from '../core/FilterSet';

export default FilterSet.extend('ResourceLinker', {
  init() {
    this._resources = {};
  },

  responseFilters() {
    return [
      function(response) {
        console.log('passing through resource linker response filter!');
        return response;
      }
    ];
  }
});
