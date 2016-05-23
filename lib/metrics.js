module.exports = function(pkg, env) {
  if (!env.METRICS_API_KEY) {
    return require('./stubs').metrics;
  }

  var utils = require('./utils');

  process.env.DATADOG_API_KEY = env.METRICS_API_KEY;
  var metrics = require('datadog-metrics');
  metrics.init({
    host: env.METRICS_HOST || require('os').hostname(),
    prefix: env.METRICS_PREFIX || (pkg.name + '.'),
    flushIntervalSeconds: env.METRICS_FLUSH_INTERVAL || 15
  });

  if (env.COLLECT_RESOURCE_USAGE) {
    var pusage = require('pidusage');

    setInterval(function() {
      pusage.stat(process.pid, function(err, stat) {
        if (err) return;
        var tags = ['pid:' + process.pid];
        metrics.gauge('resources.memory.usage', stat.memory, tags);
        metrics.gauge('resources.cpu.usage', stat.cpu, tags);
      });
    }, env.COLLECT_RESOURCE_USAGE_INTERVAL || 5000);
  }

  var gauge = function(name, value, tags) {
    return metrics.gauge(name, value, utils.processTags(tags));
  };
  var increment = function(name, value, tags) {
    if (Array.isArray(value)) {
      tags = value;
      value = 1;
    }
    return metrics.increment(name, value, utils.processTags(tags));
  };
  var histogram = function(name, value, tags) {
    return metrics.histogram(name, value, utils.processTags(tags));
  };

  return {
    isActive: true,
    gauge: gauge,
    increment: increment,
    histogram: histogram,
    flush: metrics.flush
  };
};
