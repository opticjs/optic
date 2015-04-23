import Optic from '../index';
import * as Utils from '../core/Utils';
// import Query from '../core/Query';
// import Response from '../core/Response'
// import Resource from '../core/Resource';

var Resource1 = Optic.Resource.extend({
  adapter: new Optic.HttpAdapter({
    url: function() {
      return '/resource1';
    },

    parseData: function(httpResponse, query) {
      if (query.getParams().id) {
        return new Resource1(httpResponse.body);
      } else {
        return Utils.map(httpResponse.body.dataField,
            item => new Resource1(item));
      }
    }
  })
});

describe('Optic Integration Tests', function() {
  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it('should fetch a single resource from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    Resource1.fetch().params({id: '1234'}).submit(doneFn);
    expect(doneFn.calls.count()).toEqual(1);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: `{
        "food": "bar",
        "foo": 5
      }`
    });

    var response = doneFn.calls.mostRecent().args[0];
    expect(doneFn.calls.count()).toEqual(2);
    expect(response.isFinal()).toBe(true);
    expect(response.data.get('food')).toEqual('bar');
  });

  it('should fetch a list of resources from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    Resource1.fetch().submit(doneFn);
    expect(doneFn.calls.count()).toEqual(1);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: `{
        "food": "bar",
        "foo": 5,
        "bool": true,
        "dataField": [{"id_": "1234", "title": "hi"}, {"id_": "13", "title": "hello"}]
      }`
    });

    expect(doneFn.calls.count()).toEqual(2);
    expect(doneFn.calls.mostRecent().args[0].isFinal()).toBe(true);
    expect(doneFn.calls.mostRecent().args[0].data[0].get('id_')).toEqual('1234');
  });
});
