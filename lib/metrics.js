const blocked = require('blocked');
const pusage = require('pidusage');

const utils = require('./utils');
const metricsFactory = require('./metrics_factory');

module.exports = function(pkg, env) {
  if (!env.STATSD_HOST && !env.METRICS_API_KEY) {
    return require('./stubs').metrics;
  }

  const metrics = metricsFactory.create(pkg, env);

  const obj = {
    isActive: true,
    __defaultTags: env.SERVICE_NAME ? [ `service_name:${env.SERVICE_NAME}` ] : []
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

  obj.flush = function(){
    if (env.METRICS_API_KEY){
      return metrics.flush();      
    }
    // STATSD does not require flush. 
    return;
  };

  obj.startResourceCollection = function() {
    if (env.COLLECT_RESOURCE_USAGE) {
      const tags = ['pid:' + process.pid];
      setInterval(function() {
        var memUsage = process.memoryUsage();
        obj.gauge('resources.memory.heapTotal', memUsage.heapTotal, tags);
        obj.gauge('resources.memory.heapUsed', memUsage.heapUsed, tags);
        pusage.stat(process.pid, function(err, stat) {
          if (err) return;
          obj.gauge('resources.memory.usage', stat.memory, tags);
          obj.gauge('resources.cpu.usage', stat.cpu, tags);
        });
      }, env.COLLECT_RESOURCE_USAGE_INTERVAL || 5000);

      blocked(function(ms) {
        obj.histogram('event-loop.blocked', ms, tags);
      });
    }
  }

  return obj;
};
