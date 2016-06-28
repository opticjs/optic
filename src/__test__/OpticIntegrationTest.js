import OpticObject from '../core/OpticObject';
import Optic from '../index';
import QueryCache from '../filter_sets/QueryCache';
import QueryCombiner from '../filter_sets/QueryCombiner';
import ResourceLinker from '../filter_sets/ResourceLinker';
import FetchMemory from '../filter_sets/FetchMemory';
import * as Utils from '../core/Utils';


/**
 * Tests that simulate real use of Optic.
 */

var Resource1;
var queryCache;
var queryCombiner;
var resourceLinker;
var fetchMemory;

describe('Optic Integration Tests', function() {
  function getResource(options = {}) {

    var AuthFilterSet = Optic.FilterSet.extend('AuthFilterSet', {
      queryFilters() {
        return [{
          to: Optic.Query.States.SUBMITTING,
          filter: (query, emitResponse, cb) => {
            query.replaceParams(Utils.extend({}, query.getParams(), {
              Authorization: `Bearer foobartoken`
            }));
            cb();
          }
        }];
      }
    });

    var Adapter = Optic.HttpAdapter.extend('TestHttpAdapter', {
      url: function() {
        return {
          origin: 'https://opticjs.com',
          template: '/api/bleh',
          search: {foo: 'bar', food: 'food car'}
        };
      },

      parseData: function(httpResponse, query) {
        if (query.getParams().id) {
          return new Resource1(httpResponse.body);
        } else {
          return Utils.map(httpResponse.body.dataField, item => new Resource1(item));
        }
      },

      headers: function(query) {
        return {
          Authorization: query.getParams().Authorization
        };
      }
    });

    return Optic.Resource.extend('TestResource', {
      adapter: Adapter,

      filterSets: Utils.union(
        [new AuthFilterSet()],
        options.queryCache ? [options.queryCache] : [],
        options.queryCombiner ? [options.queryCombiner] : [],
        options.resourceLinker ? [options.resourceLinker] : [],
        options.fetchMemory ? [options.fetchMemory] : []
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
    fetchMemory = new FetchMemory();
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
    expect(response.data.toJSON().food).toEqual('bar');
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

  it('should invalidate QueryCache entries with the queryCacheDeps method', function() {
    var doneFn = jasmine.createSpy('success');
    var updateFn = jasmine.createSpy('update');
    var invalidateFn = jasmine.createSpy('invalidateFn');
    Resource1 = getResource({queryCache: queryCache});

    // Initial query. Should fire an ajax request.
    Resource1.fetch().params({id: 5}).queryCacheDeps('update_query')
        .onQueryCacheInvalidate(invalidateFn)
        .submit(doneFn, updateFn);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(updateFn.calls.count()).toEqual(2);
    expect(doneFn.calls.count()).toEqual(1);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // An identical query should not fire another ajax request.
    Resource1.fetch().params({id: 5}).queryCacheDeps('update_query')
        .onQueryCacheInvalidate(invalidateFn)
        .submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(4);
    expect(doneFn.calls.count()).toEqual(2);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // This query should invalidate the previous one
    expect(invalidateFn.calls.count()).toEqual(0);
    Resource1.update().params({id: 5}).key('update_query').submit();
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(invalidateFn.calls.count()).toEqual(2);
    expect(jasmine.Ajax.requests.count()).toEqual(2);

    // Fires an ajax request because it was invalidated.
    Resource1.fetch().params({id: 5}).queryCacheDeps('update_query').submit(doneFn, updateFn);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{}'});
    expect(updateFn.calls.count()).toEqual(6);
    expect(doneFn.calls.count()).toEqual(3);
    expect(jasmine.Ajax.requests.count()).toEqual(3);
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
    var result1 = resourceDoneFn.calls.mostRecent().args[0].data;
    expect(collectionDoneFn.calls.mostRecent().args[0].data[0] === result1).toBe(true);

    // Request a separate resource and this one should not be === equals, since it's not even
    // logically equal. Just a sanity check that ResourceLinker doesn't have any false positives.
    Resource1.fetch().params({'id': 'foodbar'}).submit(resourceDoneFn);
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: `{"id": "foodbar", "title": "sup"}`
    });
    var result2 = resourceDoneFn.calls.mostRecent().args[0].data;
    expect(result1 === result2).toBe(false);
    expect(result2.get('title')).toEqual('sup');
  });

  it('should remember fetch response data with FetchMemory', function() {
    var doneFn = jasmine.createSpy('success');
    var updateFn = jasmine.createSpy('update');
    Resource1 = getResource({fetchMemory: fetchMemory});

    // Initial query. Should fire an ajax request.
    expect(updateFn.calls.count()).toEqual(0);
    Resource1.fetch().params({id: 5}).submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(1);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{"foo": "bar"}'});
    expect(updateFn.calls.count()).toEqual(2);
    expect(doneFn.calls.count()).toEqual(1);
    expect(jasmine.Ajax.requests.count()).toEqual(1);

    // An identical query should invoke the update function three times. One for the initial
    // empty provisional response. Two for the FetchMemory update. Three for the final response.
    Resource1.fetch().params({id: 5}).submit(doneFn, updateFn);
    expect(updateFn.calls.count()).toEqual(4);
    let rsp = updateFn.calls.mostRecent().args[0];
    expect(rsp.isProvisional()).toBe(true);
    expect(rsp.data.get('foo')).toEqual('bar');
    expect(doneFn.calls.count()).toEqual(1);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{"food": "car"}'});
    expect(updateFn.calls.count()).toEqual(5);
    expect(doneFn.calls.count()).toEqual(2);
    expect(jasmine.Ajax.requests.count()).toEqual(2);
    rsp = doneFn.calls.mostRecent().args[0];
    expect(rsp.data.get('food')).toEqual('car');
  });

  it('should allow the request data to be an array', function() {
    var doneFn = jasmine.createSpy('success');
    var updateFn = jasmine.createSpy('update');
    Resource1 = getResource();

    // Initial query. Should fire an ajax request.
    Resource1.create(['foo', 'bar']).params({id: 5}).submit(doneFn, updateFn);
    jasmine.Ajax.requests.mostRecent().respondWith({status: 200, responseText: '{"foo": "bar"}'});
    expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(['foo', 'bar']);
  });
});
