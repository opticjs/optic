import deepEqual from '../../core/deepEquals';
import HashMap from '../HashMap';

describe('HashMap', function() {
  it('should set and get', function() {
    var key = {foo: 'bar'};
    var map = new HashMap();
    map.set(key, 'hello');
    expect(map.get(key)).toEqual('hello');
  });

  it('should get and set with deep equals', function() {
    var map = new HashMap(deepEqual);
    map.set({foo: 'bar'}, 'hello');
    expect(map.get({foo: 'bar'})).toEqual('hello');
  });
});
