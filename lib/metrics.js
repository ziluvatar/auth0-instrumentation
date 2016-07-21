const url = require('url');
const blocked = require('blocked');
const StatsD = require('node-statsd');

const utils = require('./utils');

module.exports = function(pkg, env) {
  if (!env.STATSD_HOST) {
    return require('./stubs').metrics;
  }

  const parsedURL = url.parse(env.STATSD_HOST);

  const metrics = new StatsD({
    host: parsedURL.hostname,
    port: parsedURL.port,
    prefix: env.METRICS_PREFIX || (pkg.name + '.')
  });

  const obj = {
    isActive: true,
    __defaultTags: []
  };

  const getTags = function(tags) {
    return obj.__defaultTags.concat(utils.processTags(tags));
  };

  obj.setDefaultTags = function(tags) {
    obj.__defaultTags = utils.processTags(tags);
  };

  obj.gauge = function(name, value, tags) {
    return metrics.gauge(name, value, getTags(tags));
  };

  obj.increment = function(name, value, tags) {
    if (Array.isArray(value)) {
      tags = value;
      value = 1;
    }
    return metrics.increment(name, value, getTags(tags));
  };

  obj.histogram = function(name, value, tags) {
    return metrics.histogram(name, value, getTags(tags));
  };

  blocked(function(ms) {
    obj.histogram('event-loop.blocked', ms);
  });

  if (env.COLLECT_RESOURCE_USAGE) {
    const pusage = require('pidusage');

    setInterval(function() {
      pusage.stat(process.pid, function(err, stat) {
        if (err) return;
        const tags = ['pid:' + process.pid];
        obj.gauge('resources.memory.usage', stat.memory, tags);
        obj.gauge('resources.cpu.usage', stat.cpu, tags);
      });
    }, env.COLLECT_RESOURCE_USAGE_INTERVAL || 5000);
  }

  return obj;
};
