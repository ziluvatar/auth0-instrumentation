const Writable = require('stream').Writable;
const _ = require('lodash');

module.exports = function(pkg, env) {
  if (!env.ERROR_REPORTER_URL) {
    return require('./stubs').errorReporter;
  }

  const Raven = require('raven');

  Raven.config(env.ERROR_REPORTER_URL, {
    release:     pkg.version,
    environment: env.AUTH0_ENVIRONMENT,
    tags: {
      region: env.AWS_REGION,
      release_channel: env.RELEASE_CHANNEL
    }
  });

  //Sentry documentation say we should do .install() after config
  //but install subscribes a handler to the uncaugh exception.
  //We don't do this because we send uncaugh exceptions to bunyan
  //and Sentry is just an stream on bunyan.

  var plugin = {
    register: function (server, options, next) {
      server.on('request-error', function (request, err) {
        Raven.captureException(err, {
          req: request.raw.req,
          extra: {
            timestamp: request.info.received,
            id: request.id,
            method: request.method,
            path: request.path,
            payload: request.pre && request.pre._originalPayload,
            query: request.query,
            remoteAddress: request.info.remoteAddress,
            userAgent: request.raw.req.headers['user-agent']
          },
          level: 'warning',
          tags: options.tags
        });
      });
      next();
    }
  };

  plugin.register.attributes = { pkg: require('../package.json') };

  const captureException = Raven.captureException.bind(Raven);
  const captureMessage = Raven.captureMessage.bind(Raven);

  const stream = Writable({
    objectMode: true,
    write(entry, encoding, callback) {
      //We don't use bunyan error level for Sentry, instead
      //we send uncaugh exceptions with ERROR level
      //and everything else with WARNING level.
      const level = entry.log_type === 'uncaughtException' ? 50 : 40;
      const err = entry.err;
      if (!err) { return; }
      const extra = _.omit(entry, ['err']);
      captureException(err, { extra, level }, (err) => callback(err));
    }
  });

  return {
    hapi: { plugin: plugin },
    requestHandler: Raven.requestHandler(),
    errorHandler: Raven.errorHandler(),
    isActive: true,
    stream,
    captureMessage,
    captureException
  };
};
