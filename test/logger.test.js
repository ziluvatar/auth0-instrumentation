'use strict';

const assert = require('assert');
const spy = require('sinon').spy;
const $require = require('mockuire')(module);

const spyException = spy();
const spyMessage = spy();
const logger = $require('../lib/logger', {
  './error_reporter': function() {
    return {
      captureException: spyException,
      captureMessage: spyMessage
    }
  }
})({ name: 'test' }, { LOG_LEVEL: 'fatal' });

describe('logger', function() {
  beforeEach(function() {
    spyException.reset();
    spyMessage.reset();
  });

  describe('SentryStream', function() {
    it('should call captureException on error when level is error', function() {
      logger.error(new Error('test'));
      assert(spyException.calledOnce);
      assert(spyMessage.calledOnce === false);
    });

    it('should call captureMessage on string when level is error', function() {
      logger.error('test');
      assert(spyException.calledOnce === false);
      assert(spyMessage.calledOnce);
    });
  });
});
