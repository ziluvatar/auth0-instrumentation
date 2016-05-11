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

  return {
    isActive: true,
    gauge: metrics.gauge,
    increment: metrics.increment,
    histogram: metrics.histogram,
    flush: metrics.flush
  };
};