import createResourceClass from '../core/createResourceClass';
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

  it('should expose Optic.createResourceClass', function() {
    expect(Optic.createResourceClass).toEqual(createResourceClass);
  });
});
