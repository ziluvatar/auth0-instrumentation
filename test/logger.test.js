'use strict';

const assert = require('assert');
const sentry = require('../lib/error_reporter')({}, {});
const logger = require('../lib/logger')({ name: 'test' }, { LOG_LEVEL: 'fatal' });
const spy = require('sinon').spy;

describe('logger', function() {
  beforeEach(function() {
    sentry.captureException = spy();
    sentry.captureMessage = spy();
    sentry.captureException.reset();
    sentry.captureMessage.reset();
  });

  describe('SentryStream', function() {
    it('should call captureException on error when level is error', function() {
      logger.error(new Error('test'));
      assert(sentry.captureException.calledOnce);
      assert(sentry.captureMessage.calledOnce === false);
    });

    it('should call captureMessage on string when level is error', function() {
      logger.error('test');
      assert(sentry.captureException.calledOnce === false);
      assert(sentry.captureMessage.calledOnce);
    });
  });
});
