# auth0-instrumentation

The goal of this package is to make it easier to collect information about our services through logs, metrics, and error catching.

## Logs

By default, logs will be sent to the standard output; log collectors (like [fluentd](https://www.fluentd.org)) might be used to send them to other places like [Kibana](https://www.elastic.co/products/kibana).

The logger is powered by [pino](https://github.com/pinojs/pino), check their documentation for best practices.

Usage:

```js
var serializers = require('./serializers'); // works just like https://github.com/trentm/node-bunyan#serializers
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env, serializers);
var logger = agent.logger;

logger.info('Foo');
// logs something along the lines of:
// {"name":"foo","process":{"app":"my-app","version":"0.0.1","node":"v5.7.1"},"hostname":"dirceu-auth0.local","pid":24102,"level":30,"msg":"Foo","time":"2016-03-22T19:39:21.609Z","v":0}
logger.info({foo: 'bar'}, 'hi');
// The first field can optionally be a "fields" object, which
// is merged into the log record.
```

## Metrics

Using the right configuration, you can use a metrics collector to... well, collect metrics.

Usage:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);
var metrics = agent.metrics;

var tags = {
  'user': 'foo',
  'endpoint': '/login'
};

metrics.gauge('mygauge', 42, tags);
metrics.increment('requests.served', tags); // increment by 1
metrics.increment('some.other.thing', 5, tags); // increment by 5
metrics.histogram('service.time', 0.248);
```

## Errors

You can use the error reporter to send exceptions to an external service. You can set it up on your app in three ways, depending on what framework is being used.

### Hapi

For `hapi`, the error reporter is a plugin. To use it, you can do something like this:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);

var hapi = require('hapi');
var server = new hapi.Server();

// to capture hapi exceptions with context
server.register([agent.errorReporter.hapi.plugin], function() {});

// to capture a specific error with some extra information
agent.errorReporter.captureException('My error', {
  extra: {
    user: myUser,
    something: somethingElse,
    foo: 'bar'
  }
});
```

## Express

For `express`, the error reporter is composed of two middlewares. To use it, you can do something like this:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);

var express = require('express');
var app = express();

// before any other request handlers
app.use(agent.errorReporter.express.requestHandler);

// before any other error handlers
app.use(agent.errorReporter.express.errorHandler);

// to capture a specific error with some extra information
agent.errorReporter.captureException('My error', {
  extra: {
    user: myUser,
    something: somethingElse,
    foo: 'bar'
  }
});
```

## Other

If you don't use `hapi` or `express` - maybe it's not an HTTP API, it's a worker process or a command-line application - you can do something like this:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);

// to capture all uncaughts
agent.errorReporter.patchGlobal(function() {
  setTimeout(function(){
    process.exit(1);
  }, 200);
});

// to capture a specific error with some extra information
agent.errorReporter.captureException('My error', {
  extra: {
    user: myUser,
    something: somethingElse,
    foo: 'bar'
  }
});
```

## Configuration

Configuration is done through an object with predefined keys, usually coming from environment variables. You only need to configure the variables you want to change.

These are the variables that can be used, along with their default values:

```js

const env = {
  // general configuration
  'CONSOLE_LOG_LEVEL': 'info', // log level for console

  // Error reporter configuration
  'ERROR_REPORTER_URL': undefined, // Sentry URL
  'ERROR_REPORTER_LOG_LEVEL': 'error',

  // Metrics collector configuration
  'METRICS_API_KEY': undefined, // DataDog API key
  'STATSD_HOST': undefined, // to use statsd or dogstatsd instead of the DataDog API
  'METRICS_HOST': require('os').hostname(),
  'METRICS_PREFIX': pkg.name + '.',
  'METRICS_FLUSH_INTERVAL': 15 // seconds
};
```
