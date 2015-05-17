import OpticObject from '../core/OpticObject';
import Optic from '../index';
import QueryCache from '../filter_sets/QueryCache';
import * as Utils from '../core/Utils';
// import Query from '../core/Query';
// import Response from '../core/Response'
// import Resource from '../core/Resource';


/**
 * Tests that simulate real use of Optic.
 */

var Resource1;
var queryCache;

describe('Optic Integration Tests', function() {
  function getResource(options) {
    return Optic.Resource.extend({
      adapter: Optic.HttpAdapter.extend({
        url: function() {
          return '/resource1';
        },

        parseData: function(httpResponse, query) {
          if (query.getParams().id) {
            return new Resource1(httpResponse.body);
          } else {
            return Utils.map(httpResponse.body.dataField, item => new Resource1(item));
          }
        }
      }),

      filterSets: Utils.union(
        [],
        options.queryCache ? [queryCache] : []
      ),

      sampleInstanceMethod: function() {
        return 'hello';
      }
    });
  }

  beforeEach(function() {
    queryCache = new QueryCache();
  });

  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it('should fetch a single resource from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    Resource1 = getResource({queryCache: false});
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
    expect(response.data.sampleInstanceMethod()).toEqual('hello');
  });

  it('should fetch a list of resources from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    var arg0;
    Resource1 = getResource({queryCache: false});

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
    arg0 = doneFn.calls.mostRecent().args[0];
    expect(arg0.isFinal()).toBe(true);
    expect(arg0.data[0].get('id_')).toEqual('1234');
    expect(arg0.data[0].sampleInstanceMethod()).toEqual('hello');
  });

  it('should do basic caching with the QueryCache', function() {
    var doneFn = jasmine.createSpy('success');
    Resource1 = getResource({queryCache: true});

    // Initial query. Should fire an ajax requst.
    Resource1.fetch().params({id: 5}).submit(doneFn);
    expect(doneFn.calls.count()).toEqual(1);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(doneFn.calls.count()).toEqual(2);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // An identical query should not fire another ajax request.
    Resource1.fetch().params({id: 5}).submit(doneFn);
    expect(doneFn.calls.count()).toEqual(4);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // This query has different params so a new ajax request should be sent.
    Resource1.fetch().params({id: 6}).submit(doneFn);
    expect(doneFn.calls.count()).toEqual(5);
    expect(jasmine.Ajax.requests.count()).toEqual(2);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(doneFn.calls.count()).toEqual(6);
  });
});
