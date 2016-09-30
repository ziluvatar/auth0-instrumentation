const SentryStream = require('bunyan-sentry-stream').SentryStream;
const logFormatter = require('./utils').logFormatter;

module.exports = function getLogger(pkg, env, serializers) {
  var bunyan = require('bunyan');
  var ProcessInfo = require('auth0-common-logging').ProcessInfo;

  if (!serializers) {
    serializers = require('auth0-common-logging').Serializers;
  }

  var bunyan_streams = [{
    level: env.CONSOLE_LOG_LEVEL || env.LOG_LEVEL,
    stream: process.stdout
  }];

  if (process.env.NODE_ENV === 'production' && env.LOG_TO_WEB_URL) {
    var HttpWritableStream = require('auth0-common-logging').Streams.HttpWritableStream;
    bunyan_streams.push({
      name: 'web-url',
      stream: new HttpWritableStream(env.LOG_TO_WEB_URL),
      level: env.LOG_TO_WEB_LEVEL || 'error'
    });
  }

  if (env.LOG_TO_KINESIS || env.KINESIS_POOL) {
    var keepAliveAgent = require('./keep_alive_agent')(env);
    var KinesisWritable = require('aws-kinesis-writable');
    var KinesisStreamPool = require('aws-kinesis-writable').pool;
    var utils = require('./utils');

    var stream;
    if (env.KINESIS_POOL) {
      // pool for failover
      var kinesisStreams = env.KINESIS_POOL.map(function(config) {
        // prioritize pool config over global but if not in pool, take global (e.g. AWS_REGION)
        var kinesisInstance = new KinesisWritable(utils.buildKinesisOptions(Object.assign({}, env, config), keepAliveAgent));
        if (config.IS_PRIMARY) {
          kinesisInstance.primary = true;
        }
        return kinesisInstance;
      });
      stream = new KinesisStreamPool({
        streams: kinesisStreams
      });
    } else {
      // single stream, no failover
      stream = new KinesisWritable(utils.buildKinesisOptions(env, keepAliveAgent));
    }

    var streamErrorHandler = function(err) {
      console.error(JSON.stringify({
        message: err.message,
        records: err.records,
        stack: err.stack
      }));
    };
    stream.on('error', streamErrorHandler);
    stream.on('poolFailure', streamErrorHandler);

    bunyan_streams.push({
      name: 'kinesis',
      stream: stream,
      level: env.LOG_TO_KINESIS_LEVEL,
      type: env.LOG_TO_KINESIS_LOG_TYPE
    });

  }

  bunyan_streams.push({
    name: 'sentry',
    stream: new SentryStream(require('./error_reporter')(pkg, env)),
    level: env.ERROR_REPORTER_LOG_LEVEL || 'error',
    type: 'raw'
  });

  var logger = bunyan.createLogger({
    name: pkg.name,
    process: ProcessInfo && !env.IGNORE_PROCESS_INFO && ProcessInfo.version !== '0.0.0' ? ProcessInfo : undefined,
    region: env.AWS_REGION,
    streams: bunyan_streams,
    serializers: serializers
  });

  logger.on('error', function(err, stream) {
    console.error('Cannot write to log stream ' + stream.name + ' ' + (err && err.message));
  });

  const captureLog = logFormatter(logger);

  return {
    trace: captureLog('trace'),
    debug: captureLog('debug'),
    info: captureLog('info'),
    warn: captureLog('warn'),
    error: captureLog('error'),
    fatal: captureLog('fatal')
  };
};
