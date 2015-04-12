// import createResourceClass from '../core/createResourceClass';
import Optic from '../index';
// import Query from '../core/Query';
// import Response from '../core/Response'
// import Resource from '../core/Resource';

var Resource1 = Optic.Resource.extend({
  adapter: new Optic.HttpAdapter({
    url: '/resource1'
  })
});

describe('Optic Integration Tests', function() {
  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it('should fetch a list of resources from an HTTP endpoint', function() {
    var doneFn = jasmine.createSpy('success');
    Resource1.all().submit(doneFn);
    expect(doneFn.calls.count()).toEqual(1);

    jasmine.Ajax.requests.mostRecent().response({
      status: 200,
      contentType: 'application/json',
      responseText: '{"food": "bar", "foo": 5, "bool": true}'
    });

    expect(doneFn.calls.count()).toEqual(2);
  });
});
