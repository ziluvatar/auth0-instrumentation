const pino = require('pino');
const _ = require('lodash');
const processInfo = require('auth0-common-logging').ProcessInfo;
const defaultSerializers = require('auth0-common-logging').Serializers;

function logSerializer(logger, defaults) {
  return function captureLog(lvl) {
    return function serializeLog() {
      const args = Array.from(arguments);
      if (typeof args[0] === 'string' && typeof args[1] !== 'string') {
        const swap = args[0];
        args[0] = args[1] || {};
        args[1] = swap;
      }
      args[0] = _.defaults(args[0], defaults);
      return logger[lvl].apply(logger, args);
    };
  };
};

module.exports = function getLogger(pkg, env, serializers) {
  const logger = pino({
    name: pkg.name,
    serializers: serializers || defaultSerializers,
    level: env.CONSOLE_LOG_LEVEL || env.LOG_LEVEL || 'info',
    slowTime: true,
    extreme: env.BUFFER_LOGS
  });

  const captureLog = logSerializer(logger, {
    process: !env.IGNORE_PROCESS_INFO ? processInfo : undefined,
    region: env.AWS_REGION || undefined,
    service_name: env.SERVICE_NAME || undefined,
  });

  return {
    trace: captureLog('trace'),
    debug: captureLog('debug'),
    info: captureLog('info'),
    warn: captureLog('warn'),
    error: captureLog('error'),
    fatal: captureLog('fatal')
  };
};
