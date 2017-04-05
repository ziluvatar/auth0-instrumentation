var assert = require('assert');

var metrics = require('../lib/metrics')({
  name: 'test'
}, {
  STATSD_HOST: 'http://localhost:8125'
});

var processTags = require('../lib/utils').processTags;

describe('metrics', function() {
  it('should return isActive as true', function(done) {
    assert.equal(metrics.isActive, true);
    done();
  });

  it('should run gauge without throwing', function(done) {
    assert.doesNotThrow(function() {
      metrics.gauge('foo.bar', 14);
      metrics.gauge('foo.bar', 14, ['tag1:a', 'tag2:b']);
      metrics.gauge('foo.bar', 14, {'tag1': 'a', 'tag2': 'b'});
    }, TypeError);
    done();
  });

  it('should run increment without throwing', function(done) {
    assert.doesNotThrow(function() {
      metrics.increment('foo.bar', 1);
      metrics.increment('foo.bar', 1, ['tag1:a', 'tag2:b']);
      metrics.increment('foo.bar', 1, {'tag1': 'a', 'tag2': 'b'});
      metrics.increment('foo.bar');
      metrics.increment('foo.bar', ['tag1:a', 'tag2:b']);
      metrics.increment('foo.bar', {'tag1': 'a', 'tag2': 'b'});
    }, TypeError);
    done();
  });

  it('should run track without throwing', function(done) {
    assert.doesNotThrow(function() {
      var id = metrics.time('foo.bar');
      assert.ok(id);
      metrics.endTime('foo.bar', id);
      id = metrics.time('foo.bar', ['tag1:a', 'tag2:b']);
      assert.ok(id);
      metrics.endTime('foo.bar', id, ['tag1:a', 'tag2:b']);
      id = metrics.time('foo.bar', {'tag1': 'a', 'tag2': 'b'});
      metrics.endTime('foo.bar', id, {'tag1': 'a', 'tag2': 'b'});
      assert.ok(id);
    }, TypeError);
    done();
  });

  it('should run histogram without throwing', function(done) {
    assert.doesNotThrow(function() {
      metrics.gauge('foo.bar', 5.5);
      metrics.gauge('foo.bar', 5.5, ['tag1:a', 'tag2:b']);
      metrics.gauge('foo.bar', 5.5, {'tag1': 'a', 'tag2': 'b'});
    }, TypeError);
    done();
  });

  it('should run setDefaultTags without throwing', function(done) {
    assert.doesNotThrow(metrics.setDefaultTags, TypeError);
    done();
  });

  it('should set default tags', function(done) {
    metrics.setDefaultTags({'color': 'red', 'region': 'west'});
    assert.deepEqual(metrics.__defaultTags, ['color:red', 'region:west']);
    done();
  });

  describe('processTags', function() {

    it('should accept an array of strings', function(done) {
      assert.deepEqual(
        processTags(['foo:bar', 'bar:baz']),
        ['foo:bar', 'bar:baz']);
      done();
    });

    it('should accept an object', function(done) {
      assert.deepEqual(
        processTags({'foo':'bar', 'bar':'baz'}),
        ['foo:bar', 'bar:baz']);
      done();
    });

    it('should return an empty array otherwise', function(done) {
      assert.deepEqual(processTags(3), []);
      assert.deepEqual(processTags('lol'), []);
      assert.deepEqual(processTags(4.5), []);
      done();
    });

  });
});
