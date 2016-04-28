module.exports = function getLogger(pkg, env, serializers) {
  var bunyan = require('bunyan');
  var ProcessInfo = require('auth0-common-logging').ProcessInfo;

  if (!serializers) {
    serializers = require('auth0-common-logging').Serializers;
  }

  var bunyan_streams = [{
    level: env['CONSOLE_LOG_LEVEL'] || env['LOG_LEVEL'],
    stream: process.stdout
  }];

  if (env['LOG_TO_SQS']) {
    var bunyanSqs = require('bunyan-sqs');
    bunyan_streams.push({
      level: env['LOG_TO_SQS_LEVEL'],
      stream: bunyanSqs.createStream({
        name:            'sqs',
        accessKeyId:     env['AWS_ACCESS_KEY_ID'],
        secretAccessKey: env['AWS_ACCESS_KEY_SECRET'],
        region:          env['AWS_REGION'],
        queueName:       env['LOG_TO_SQS'],
      })
    });
  }

  if(process.env.NODE_ENV === "production" && env['LOG_TO_WEB_URL']){
    var HttpWritableStream = require('auth0-common-logging').Streams.HttpWritableStream;
    bunyan_streams.push({
      name: 'web-url',
      stream: new HttpWritableStream(env['LOG_TO_WEB_URL']),
      level: env['LOG_TO_WEB_LEVEL'] || 'error'
    });
  }

  if (env['LOG_TO_KINESIS']) {
    var KinesisWritable = require('aws-kinesis-writable');
    var keep_alive_agent = require('./keep_alive_agent')(env);
    var stream = new KinesisWritable({
      accessKeyId: env['AWS_ACCESS_KEY_ID'],
      secretAccessKey: env['AWS_ACCESS_KEY_SECRET'],
      streamName: env['LOG_TO_KINESIS'],
      region: env['AWS_KINESIS_REGION'] || env['AWS_REGION'],
      httpOptions: {
        agent: keep_alive_agent('aws-kinesis')
      },
      objectMode: typeof env['KINESIS_OBJECT_MODE'] !== 'undefined' ? env['KINESIS_OBJECT_MODE'] : true,
      partitionKey: env['LOG_TO_KINESIS_PARTITION_KEY'] || pkg.name,
      buffer: {
        timeout: env['KINESIS_TIMEOUT'] || 5,
        length: env['KINESIS_LENGTH'] || 50,
        isPrioritaryMsg: function (entry) {
          return entry.level >= 40;
        }
      }
    });

    bunyan_streams.push({
      name: 'kinesis',
      stream: stream,
      level: env['LOG_TO_KINESIS_LEVEL'],
      type: env['LOG_TO_KINESIS_LOG_TYPE']
    });
  }

  var logger = bunyan.createLogger({
    name: pkg.name,
    process: ProcessInfo && !env['IGNORE_PROCESS_INFO'] && ProcessInfo.version !== '0.0.0' ? ProcessInfo : undefined,
    region: env['AWS_REGION'],
    streams: bunyan_streams,
    serializers: serializers
  });

  logger.on('error', function(err, stream) {
    console.log('Cannot write to log stream ' + stream.name + ' ' + (err && err.message));
  });

  return logger;
};
