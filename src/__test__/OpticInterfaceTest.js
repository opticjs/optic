import Resource from '../core/Resource';
import Optic from '../index';
import Query from '../core/Query';
import Response from '../core/Response'

describe('Optic Interface', function() {
  it('should expose Optic.Response', function() {
    expect(Optic.Response).toEqual(Response);
  });

  it('should expose Optic.Query', function() {
    expect(Optic.Query).toEqual(Query);
  });

  it('should expose Optic.Resource', function() {
    expect(Optic.Resource).toEqual(Resource);
  });

  it('should expose Optic.Response', function() {
    expect(Optic.Response).toEqual(Response);
  });
});
