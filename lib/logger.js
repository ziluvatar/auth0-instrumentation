const bunyan = require('bunyan');
const ProcessInfo = require('auth0-common-logging').ProcessInfo;
const Serializers = require('auth0-common-logging').Serializers;
const HttpWritableStream = require('auth0-common-logging').Streams.HttpWritableStream;
const KinesisWritable = require('aws-kinesis-writable');
const KinesisStreamPool = require('aws-kinesis-writable').pool;

const utils = require('./utils');
const KeepAliveAgent = require('./keep_alive_agent');
const logFormatter = require('./utils').logFormatter;

module.exports = function getLogger(pkg, env, serializers, errorReporter) {
  if (!serializers) {
    serializers = Serializers;
  }

  var bunyan_streams = [{
    level: env.CONSOLE_LOG_LEVEL || env.LOG_LEVEL,
    stream: process.stdout
  }];

  if (process.env.NODE_ENV === 'production' && env.LOG_TO_WEB_URL) {
    var httpStream = new HttpWritableStream(env.LOG_TO_WEB_URL);
    httpStream.on('error', function(err) {
      if (err) {
        console.error('Error on writing logs to web url', JSON.stringify({
          message: err.message,
          stack: err.stack
        }));
      } else {
        console.error('Error on writing logs to web url');
      }
    });
    bunyan_streams.push({
      name: 'web-url',
      stream: httpStream,
      level: env.LOG_TO_WEB_LEVEL || 'error'
    });
  }

  if (env.LOG_TO_KINESIS || env.KINESIS_POOL) {
    var keepAliveAgent = KeepAliveAgent(env);
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
      if (err) {
        console.error('Error on writing logs to Kinesis', JSON.stringify({
          message: err.message,
          records: err.records,
          stack: err.stack
        }));
      } else {
        console.error('Error on writing logs to Kinesis');
      }
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

  if (errorReporter && errorReporter.stream) {
    bunyan_streams.push({
      name:   'sentry',
      stream: errorReporter.stream,
      level:  env.ERROR_REPORTER_LOG_LEVEL || 'error',
      type:   'raw'
    });
  }

  const process_info = ProcessInfo &&
    !env.IGNORE_PROCESS_INFO &&
    ProcessInfo.version !== '0.0.0' ? ProcessInfo : undefined;

  const logger = bunyan.createLogger({
    name:         pkg.name,
    process:      process_info,
    region:       env.AWS_REGION || undefined,
    service_name: env.SERVICE_NAME || undefined,
    channel:      env.RELEASE_CHANNEL,
    streams:      bunyan_streams,
    serializers:  serializers
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
