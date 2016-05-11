var stubs = require('./lib/stubs');

module.exports = {
  logger: stubs.logger,
  errorReporter: stubs.errorReporter,
  metrics: stubs.metrics,

  init: function(pkg, env, serializers) {
    this.logger = require('./lib/logger')(pkg, env, serializers);
    this.errorReporter = require('./lib/error_reporter')(pkg, env);
    this.metrics = require('./lib/metrics')(pkg, env);
  }
};