# auth0-instrumentation

The goal of this package is to make it easier to collect information about our services through logs, metrics and error catching.

## Logs

With the right configuration, logs will go from the local server to "THE CLOUD", then a bunch of awesome stuff will happen and they'll become available on the [tenant's dashboard](https://auth0.com/docs/api/v2#!/Logs/get_logs) (if it's related to "business" logs) or on [Kibana](https://kibana.it.auth0.com) (for everything else).

Logger usage:

```js
const pkg = require('./package.json');
const env = require('./lib/env');
const instrumentation = require('auth0-instrumentation')(pkg, env);
const logger = instrumentation.logger;

logger.info('Foo')
// logs something along the lines of:
// {"name":"foo","process":{"app":"my-app","version":"0.0.1","node":"v5.7.1"},"hostname":"dirceu-auth0.local","pid":24102,"level":30,"msg":"Foo","time":"2016-03-22T19:39:21.609Z","v":0}
```

## Configuration

Configuration is done through an object with predefined keys, usually coming from environment variables.

These are the variables that can be used, along with their default values:

```js

const env = {
  // general configuration
  'CONSOLE_LOG_LEVEL': 'info', // log level for console

  // AWS configuration for SQS and Kinesis
  'AWS_ACCESS_KEY_ID': undefined,
  'AWS_ACCESS_KEY_SECRET': undefined,
  'AWS_REGION': undefined

  // SQS configuration
  'LOG_TO_SQS': '', // SQS queue name
  'LOG_TO_SQS_LEVEL': 'info', // log level for SQS

  // Kinesis configuration
  'LOG_TO_KINESIS': undefined, // Kinesis stream name
  'LOG_TO_KINESIS_LEVEL': 'info', // log level for Kinesis
  'KINESIS_OBJECT_MODE': true,
  'KINESIS_TIMEOUT': 5,
  'KINESIS_LENGTH': 50,
};
```