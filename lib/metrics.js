module.exports = function(pkg, env) {
  if (!env.METRICS_API_KEY) {
    var noop = function() {};
    return {
      gauge: noop,
      increment: noop,
      histogram: noop,
      flush: noop
    };
  }

  process.env.DATADOG_API_KEY = env.METRICS_API_KEY;
  var metrics = require('datadog-metrics');
  metrics.init({
    host: env.METRICS_HOST || require('os').hostname(),
    prefix: env.METRICS_PREFIX || (pkg.name + '.'),
    flushIntervalSeconds: env.METRICS_FLUSH_INTERVAL || 15
  });

  return {
    gauge: metrics.gauge,
    increment: metrics.increment,
    histogram: metrics.histogram,
    flush: metrics.flush
  };
};