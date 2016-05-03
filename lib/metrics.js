module.exports = function(pkg, env) {
  if (!env.METRICS_API_KEY) {
    return require('./stubs').metrics;
  }

  process.env.DATADOG_API_KEY = env.METRICS_API_KEY;
  var metrics = require('datadog-metrics');
  metrics.init({
    host: env.METRICS_HOST || require('os').hostname(),
    prefix: env.METRICS_PREFIX || (pkg.name + '.'),
    flushIntervalSeconds: env.METRICS_FLUSH_INTERVAL || 15
  });

  return {
    isActive: true,
    gauge: metrics.gauge,
    increment: metrics.increment,
    histogram: metrics.histogram,
    flush: metrics.flush
  };
};