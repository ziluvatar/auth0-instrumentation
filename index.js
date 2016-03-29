var raven = require('raven');

function _getErrorReporter(pkg, env) {
  if (!env['ERROR_REPORTER_URL'] || !env['ERROR_REPORTER_FRAMEWORK'] || ['hapi', 'express'].indexOf(env['ERROR_REPORTER_FRAMEWORK']) === -1) {
    return null;
  }

  if (env['ERROR_REPORTER_FRAMEWORK'] === 'hapi') {
    var plugin = {
      register: function (server, options, next) {
        var client = new raven.Client(options.dsn);
        server.expose('client', client);
        server.on('request-error', function (request, err) {
          client.captureError(err, {
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
            tags: options.tags
          });
        });

        next();
      },
      options: {
        dsn: env['ERROR_REPORTER_URL']
      }
    };
    plugin.register.attributes = { pkg: require('./package.json') };
    return plugin;
  }

  if (env['ERROR_REPORTER_FRAMEWORK'] === 'express') {
    return {
      requestHandler: raven.middleware.express.requestHandler(env['ERROR_REPORTER_URL']),
      errorHandler: raven.middleware.express.errorHandler(env['ERROR_REPORTER_URL'])
    };
  }
}


module.exports = {
  logger: null,
  errorReporter: null,

  init: function(pkg, env, serializers) {
    this.logger = require('./lib/logger')(pkg, env, serializers);
    this.errorReporter = _getErrorReporter(pkg, env);
  }
};