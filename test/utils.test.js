'use strict';

const assert = require('assert');

const stubs = require('../lib/stubs');
const utils = require('../lib/utils');
const logFormatter = utils.logFormatter;
const loggerStub = stubs.logger;

describe('Utils', function() {
  describe('logFormatter', function() {
    var logger = {};
    before(function() {
      logger.info = logFormatter(loggerStub)('info');
    });

    afterEach(function() {
      loggerStub.info.reset();
    });
    it('should not modify str logs', function() {
      logger.info('test');
      assert(loggerStub.info.calledWith('test'));
    });
    it('should not modify bunyan compatible logs', function() {
      logger.info(new Error(), 'test');
      assert(loggerStub.info.calledWith(new Error(), 'test'));
    });
    it('should switch object to first index on winston style logs', function() {
      logger.info('test', new Error());
      assert(loggerStub.info.calledWith(new Error(), 'test'));
    });
    it('should proxy subsequent strings and args', function() {
      logger.info('test', new Error(), 'some otherstrings');
      assert(loggerStub.info.calledWith(new Error(), 'test', 'some otherstrings'));
    });
  });
});
