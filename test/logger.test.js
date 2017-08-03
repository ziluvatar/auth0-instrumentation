'use strict';

const Writable = require('stream').Writable;
const assert = require('assert');
const Logger = require('../lib/logger');

describe('logger', function() {
  var entries;
  var logger;

  beforeEach(function() {
    entries = [];
    logger =  Logger({ name: 'test' }, { LOG_LEVEL: 'fatal' }, null, {
      stream: Writable({
        objectMode: true,
        write: (entry, enc, callback) => {
          entries.push(entry);
          callback();
        }
      })
    });
  });

  describe('SentryStream', function() {
    it('should call captureException on error when level is error', function() {
      const err = new Error('test');
      logger.error({ err });
      assert.equal(entries.length, 1);
      assert.equal(entries[0].err.message, err.message);
      assert.equal(entries[0].err.stack, err.stack);
    });
  });
});
