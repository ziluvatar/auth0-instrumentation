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

  if(process.env.NODE_ENV === 'production' && env.LOG_TO_WEB_URL){
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

    var stream;
    // build kinesis stream array
    if (env.KINESIS_POOL) {
      var kinesisStreams = env.KINESIS_POOL.map(function(configUnit) {
        //prioritize pool config over global but if not in pool take global, ie AWS_REGION
        return new KinesisWritable(_buildKinesisOptions(Object.assign({}, env, configUnit)), keepAliveAgent);
      });
      stream = new KinesisStreamPool({
        streams: kinesisStreams
      });
    //backward compatibility writable    
    } else {
      stream = new KinesisWritable(_buildKinesisOptions(env), keepAliveAgent);
    }

    stream.on('error', function(err) {
      console.error(JSON.stringify({
        message: err.message,
        records: err.records,
        stack: err.stack
      }));
    });

    bunyan_streams.push({
      name: 'kinesis',
      stream: stream,
      level: env.LOG_TO_KINESIS_LEVEL,
      type: env.LOG_TO_KINESIS_LOG_TYPE
    });
    
  }

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

  return logger;
};

function _buildKinesisOptions(configMap, keepAliveAgent) {
  return {
    accessKeyId: configMap.AWS_ACCESS_KEY_ID,
    secretAccessKey: configMap.AWS_ACCESS_KEY_SECRET,
    streamName: configMap.LOG_TO_KINESIS,
    region: configMap.AWS_KINESIS_REGION || configMap.AWS_REGION,
    getCredentialsFromIAMRole: configMap.AWS_GET_CREDENTIALS_FROM_IAM_ROLE,
    httpOptions: {
      agent: keepAliveAgent('aws-kinesis')
    },
    objectMode: typeof configMap.KINESIS_OBJECT_MODE !== 'undefined' ? configMap.KINESIS_OBJECT_MODE : true,
    buffer: {
      timeout: configMap.KINESIS_TIMEOUT || 5,
      length: configMap.KINESIS_LENGTH || 50,
      isPrioritaryMsg: function (entry) {
        return entry.level >= 40;
      }
    }
  };
}

