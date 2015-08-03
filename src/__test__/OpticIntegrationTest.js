import OpticObject from '../core/OpticObject';
import Optic from '../index';
import QueryCache from '../filter_sets/QueryCache';
import QueryCombiner from '../filter_sets/QueryCombiner';
import ResourceLinker from '../filter_sets/ResourceLinker';
import * as Utils from '../core/Utils';
// import Query from '../core/Query';
// import Response from '../core/Response'
// import Resource from '../core/Resource';


/**
 * Tests that simulate real use of Optic.
 */

var Resource1;
var queryCache;
var queryCombiner;
var resourceLinker;

describe('Optic Integration Tests', function() {
  function getResource(options = {}) {
    var Adapter = Optic.HttpAdapter.extend('TestHttpAdapter', {
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
    });

    return Optic.Resource.extend('TestResource', {
      adapter: Adapter,

      filterSets: Utils.union(
        options.queryCache ? [options.queryCache] : [],
        options.queryCombiner ? [options.queryCombiner] : [],
        options.resourceLinker ? [options.resourceLinker] : []
      ),

      sampleInstanceMethod: function() {
        return 'hello';
      }
    });
  }

  beforeEach(function() {
    jasmine.Ajax.install();

    // Setup filter sets
    queryCache = new QueryCache();
    queryCombiner = new QueryCombiner();
    resourceLinker = new ResourceLinker();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it('should fetch a single resource from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    var updateFn = jasmine.createSpy('update');
    Resource1 = getResource();
    Resource1.fetch().params({id: '1234'}).submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(1);
    expect(doneFn.calls.count()).toEqual(0);

    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: `{
        "food": "bar",
        "foo": 5
      }`
    });

    var response = doneFn.calls.mostRecent().args[0];
    expect(updateFn.calls.count()).toEqual(2);
    expect(doneFn.calls.count()).toEqual(1);
    expect(response.isProvisional()).toBe(false);
    expect(response.data.get('food')).toEqual('bar');
    expect(response.data.sampleInstanceMethod()).toEqual('hello');
  });

  it('should fetch a list of resources from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    var updateFn = jasmine.createSpy('update');
    var arg0;
    Resource1 = getResource();

    Resource1.fetch().submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(1);

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

    expect(doneFn.calls.count()).toEqual(1);
    arg0 = doneFn.calls.mostRecent().args[0];
    expect(arg0.isProvisional()).toBe(false);
    expect(arg0.data[0].get('id_')).toEqual('1234');
    expect(arg0.data[0].sampleInstanceMethod()).toEqual('hello');
  });

  it('should do basic caching with the QueryCache', function() {
    var doneFn = jasmine.createSpy('success');
    var updateFn = jasmine.createSpy('update');
    Resource1 = getResource({queryCache: queryCache});

    // Initial query. Should fire an ajax request.
    expect(updateFn.calls.count()).toEqual(0);
    Resource1.fetch().params({id: 5}).submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(1);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(updateFn.calls.count()).toEqual(2);
    expect(doneFn.calls.count()).toEqual(1);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // An identical query should not fire another ajax request.
    Resource1.fetch().params({id: 5}).submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(4);
    expect(doneFn.calls.count()).toEqual(2);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // This query has different params so a new ajax request should be sent.
    Resource1.fetch().params({id: 6}).submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(5);
    expect(jasmine.Ajax.requests.count()).toEqual(2);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(updateFn.calls.count()).toEqual(6);
    expect(doneFn.calls.count()).toEqual(3);
  });

  it('should do basic query combining with QueryCombiner', function() {
    var doneFn1 = jasmine.createSpy('success');
    var doneFn2 = jasmine.createSpy('success');
    var updateFn1 = jasmine.createSpy('update');
    var updateFn2 = jasmine.createSpy('update');
    Resource1 = getResource({queryCombiner: queryCombiner});

    // Initial query. Should fire an ajax request.
    Resource1.fetch().params({id: 5}).submit(doneFn1, updateFn1);
    expect(updateFn1.calls.count()).toEqual(1);
    expect(updateFn2.calls.count()).toEqual(0);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // An identical query. This should be linked with the previous one, and should not fire it's
    // own ajax request.
    Resource1.fetch().params({id: 5}).submit(doneFn2, updateFn2);
    expect(updateFn1.calls.count()).toEqual(1);
    expect(updateFn2.calls.count()).toEqual(1);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // The ajax query for the initial query now returns.
    expect(doneFn1.calls.count()).toEqual(0);
    expect(doneFn2.calls.count()).toEqual(0);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(jasmine.Ajax.requests.count()).toEqual(1);
    expect(updateFn1.calls.count()).toEqual(2);
    expect(updateFn2.calls.count()).toEqual(2);
    expect(doneFn1.calls.count()).toEqual(1);
    expect(doneFn2.calls.count()).toEqual(1);
  });

  it('should do basic resource linking with ResourceLinker', function() {
    // First request a collection of stuff.
    var collectionDoneFn = jasmine.createSpy('success');
    Resource1 = getResource({resourceLinker: resourceLinker});

    Resource1.fetch().submit(collectionDoneFn);
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: `{
        "food": "bar",
        "foo": 5,
        "bool": true,
        "dataField": [{"id": "1234", "title": "hi"}, {"id": "13", "title": "hello"}]
      }`
    });

    // Then request one of the items in the collection independently.
    var resourceDoneFn = jasmine.createSpy('success');
    Resource1.fetch().params({'id': '1234'}).submit(resourceDoneFn);
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: `{"id": "1234", "title": "hi"}`
    });

    // The resulting resources should be triple equal to each other
    expect(collectionDoneFn.calls.mostRecent().args[0].data[0] ===
        resourceDoneFn.calls.mostRecent().args[0].data).toBe(true);
  });
});
