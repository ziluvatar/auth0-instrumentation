module.exports = {
  logger: null,
  errorReporter: null,

  init: function(pkg, env, serializers) {
    this.logger = require('./lib/logger')(pkg, env, serializers);
    this.errorReporter = require('./lib/error_reporter')(pkg, env);
    this.metrics = require('./lib/metrics')(pkg, env);
  }
};