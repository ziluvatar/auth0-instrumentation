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
      objectMode: typeof env['KINESIS_OBJECT_MODE'] !== 'undefined' ? env['KINESIS_OBJECT_MODE'] : false,
      partitionKey: pkg.name,
      buffer: {
        timeout: env['KINESIS_TIMEOUT'] || 5,
        length: env['KINESIS_LENGTH'] || 50,
        isPrioritaryMsg: function (entry) {
          return entry.level >= 40;
        }
      }
    });

    stream.on('error', function (err) {
      (err.records || []).forEach(function (r) {
        if (r && r.Data) {
          console.log('--------THIS ENTRY IS TOO BIG-----------');
          console.log(r.Data);
          console.log('--------THIS ENTRY IS TOO BIG-----------');
        }
      });

      logger.error({
        err: err,
      }, 'Error sending log entry to kinesis.');
    });

    bunyan_streams.push({
      stream: stream,
      level: env['LOG_TO_KINESIS_LEVEL'],
      type: 'raw'
    });
  }

  var logger = bunyan.createLogger({
    name: pkg.name,
    process: ProcessInfo && !env['IGNORE_PROCESS_INFO'] && ProcessInfo.version !== '0.0.0' ? ProcessInfo : undefined,
    region: env['AWS_REGION'],
    streams: bunyan_streams,
    serializers: serializers
  });

  return logger;
};
