/* global describe, it */

const assert = require('assert');
const rmdir = require('rmdir');
const PromisedCache = require('../PromisedCache');

describe('PromisedCache', () => {
  it('should instantiate', () => {
    assert.doesNotThrow(() => {
      const cache = new PromisedCache('/tmp/PromisedCache');
      cache.toString();
      rmdir('/tmp/PromisedCache');
    });
  });

  describe('#get/set', () => {
    it('should set and get a cache post', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#getset');
      cache.set('testkey', { a: 123 }).then(() => {
        cache.get('testkey').then((value) => {
          rmdir('/tmp/PromisedCache#getset');
          assert.equal(value.a, 123);
          assert.equal(Object.keys(value).length, 1);
          done();
        }, done);
      }, done);
    });

    it('should set and get a cache post using new instance', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#getset2');
      cache.set('testkey', { name: 'Anna', age: 32 }).then(() => {
        const cache2 = new PromisedCache('/tmp/PromisedCache#getset2');
        cache2.get('testkey').then((value) => {
          rmdir('/tmp/PromisedCache#getset2');
          assert.equal(value.name, 'Anna');
          assert.equal(value.age, 32);
          assert.equal(Object.keys(value).length, 2);
          done();
        }, done);
      }, done);
    });

    it('should not throw when getting with a non existing key', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#getset3');
      assert.doesNotThrow(() => {
        cache.get('idonotexist').then(() => {
          rmdir('/tmp/PromisedCache#getset3');
          done();
        }, done);
      }, Error);
    });

    it('should not get post that has expired', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#getset4', 1);
      cache.set('testkey', 123).then(() => {
        setTimeout(() => {
          cache.get('testkey').then((value) => {
            rmdir('/tmp/PromisedCache#getset4');
            assert.equal(value, undefined);
            done();
          }, done);
        }, 10);
      }, done);
    });

    it('should not get post that has expired using new instance', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#getset5', 1);
      cache.set('testkey', 123).then(() => {
        setTimeout(() => {
          const cache2 = new PromisedCache('/tmp/PromisedCache#getset5', 1);
          cache2.get('testkey').then((value) => {
            rmdir('/tmp/PromisedCache#getset5');
            assert.equal(value, undefined);
            done();
          }, done);
        }, 10);
      }, done);
    });
  });

  describe('#delete', () => {
    it('should delete a cache post', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#delete');
      cache.set('testkey', 123).then(() => {
        cache.delete('testkey').then(() => {
          cache.get('testkey').then((value) => {
            rmdir('/tmp/PromisedCache#delete');
            assert.equal(value, undefined);
            done();
          }, done);
        }, done);
      }, done);
    });

    it('should not throw when deleting with a non existing key', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#delete2');
      assert.doesNotThrow(() => {
        cache.delete('idonotexist').then(() => {
          rmdir('/tmp/PromisedCache#delete2');
          done();
        }, done);
      }, Error);
    });

    it('should delete a cache post using new instance', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#delete3');
      cache.set('testkey', 123).then(() => {
        cache.delete('testkey').then(() => {
          const cache2 = new PromisedCache('/tmp/PromisedCache#delete3');
          cache2.get('testkey').then((value) => {
            rmdir('/tmp/PromisedCache#delete3');
            assert.equal(value, undefined);
            done();
          }, done);
        }, done);
      }, done);
    });
  });

  describe('#clear', () => {
    it('should clear the cache', (done) => {
      const cache = new PromisedCache('/tmp/PromisedCache#clear');
      cache.set('testkey', 123).then(() => {
        cache.clear().then(() => {
          cache.get('testkey').then((value) => {
            rmdir('/tmp/PromisedCache#clear');
            assert.equal(value, undefined);
            done();
          }, done);
        }, done);
      }, done);
    });
  });

  describe('#getFilenameForKey', () => {
    it('should return a valid filename', () => {
      const cache = new PromisedCache('/tmp/PromisedCache#getFilenameForKey');
      assert.equal(
        cache.getFilenameForKey('testkey'),
        '/tmp/PromisedCache#getFilenameForKey/testkey.json.gz'
      );
      rmdir('/tmp/PromisedCache#getFilenameForKey');
    });
  });
});
