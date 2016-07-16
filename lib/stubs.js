const spy = require('sinon').spy;

const emptyMiddleware = function (a, b, next) { next(); };

const emptyLogger = {
  trace: spy(),
  debug: spy(),
  info: spy(),
  warn: spy(),
  error: spy(),
  fatal: spy()
};

const emptyErrorReporter = {
  isActive: false,
  captureException: spy(),
  captureMessage: spy(),
  patchGlobal: spy(),
  hapi: {
    plugin: {
      register: emptyMiddleware
    }
  },
  express: {
    requestHandler: emptyMiddleware,
    errorHandler: emptyMiddleware
  },
};
emptyErrorReporter.hapi.plugin.register.attributes = { pkg: require('../package.json') };

const emptyMetrics = {
  isActive: false,
  gauge: spy(),
  increment: spy(),
  histogram: spy(),
  flush: spy(),
  setDefaultTags: spy()
};

module.exports = {
  logger: emptyLogger,
  errorReporter: emptyErrorReporter,
  metrics: emptyMetrics
};
