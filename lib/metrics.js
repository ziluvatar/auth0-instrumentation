const blocked = require('blocked');
const pusage = require('pidusage');
const uuid = require('uuid');
const fargs = require('very-fast-args');
const utils = require('./utils');
const metricsFactory = require('./metrics_factory');
const stubs = require('./stubs').metrics;


module.exports = function (pkg, env) {
  if (!env.STATSD_HOST && !env.METRICS_API_KEY) {
    return stubs;
  }

  const metrics = metricsFactory.create(pkg, env);

  const obj = {
    isActive: true,
    trackIds: {},
    __defaultTags: []
  };

  if (env.SERVICE_NAME) {
    obj.__defaultTags.push(`service_name:${env.SERVICE_NAME}`);
  } else if (env.METRICS_PKG_AS_SERVICE_NAME) {
    obj.__defaultTags.push(`service_name:${pkg.name}`);
  }
  const getTags = function (tags) {
    return obj.__defaultTags.concat(utils.processTags(tags));
  };

  obj.setDefaultTags = function (tags) {
    obj.__defaultTags = utils.processTags(tags);
  };

  obj.gauge = function (name, value, tags, callback) {
    callback = callback || stubs.callback;
    return metrics.gauge(name, value, getTags(tags), callback);
  };

  obj.increment = function (name, value, tags, callback) {
    callback = callback || stubs.callback;
    if (Array.isArray(value)) {
      tags = value;
      value = 1;
    }
    return metrics.increment(name, value, getTags(tags), callback);
  };

  obj.histogram = function (name, value, tags, callback) {
    callback = callback || stubs.callback;
    return metrics.histogram(name, value, getTags(tags), callback);
  };

  obj.flush = function () {
    if (env.METRICS_API_KEY) {
      return metrics.flush();
    }
    // STATSD does not require flush.
    return;
  };

  obj.time = function (metricName, tags) {
    const id = uuid.v4();
    obj.increment(`${metricName}.started`, 1, tags);
    obj.trackIds[id] = { date: Date.now(), metricName: metricName };
    return id;
  };

  obj.endTime = function (id, tags) {
    if (!obj.trackIds[id]) {
      return;
    }

    const metricName = obj.trackIds[id].metricName;
    var time = Date.now() - obj.trackIds[id].date;
    delete obj.trackIds[id];
    obj.increment(`${metricName}.ended`, 1, tags);
    obj.histogram(`${metricName}.time`, time, tags);
  };

  obj.functionTime = function (fn, name, tags) {
    return function () {
      var args = fargs.apply(null, arguments);
      var fin = args.pop();

      const id = obj.time(name, tags);

      // async function - wrap the callback to instrument.
      if (typeof fin === 'function') {
        args.push(function callback() {
          obj.endTime(id, tags);
          return cb.apply(this, arguments);
        });
        return fn.apply(this, args);
      }

      // sync function - call function and then instrument.
      args.push(fin);
      var ret = fn.apply(this, args);
      obj.endTime(id, tags);
      return ret;
    }
  }


  obj.startResourceCollection = function (tags) {
    if (!env.COLLECT_RESOURCE_USAGE) {
      return;
    }

    tags = tags || {};

    setInterval(function () {
      var memUsage = process.memoryUsage();
      obj.gauge('resources.memory.heapTotal', memUsage.heapTotal, tags);
      obj.gauge('resources.memory.heapUsed', memUsage.heapUsed, tags);

      pusage.stat(process.pid, function (err, stat) {
        if (err) {
          return;
        }
        obj.gauge('resources.memory.usage', stat.memory, tags);
        obj.gauge('resources.cpu.usage', stat.cpu, tags);
      });
    }, env.COLLECT_RESOURCE_USAGE_INTERVAL || 5000);

    blocked(function (ms) {
      obj.histogram('event_loop.blocked', ms, tags);
    });
  };

  return obj;
};
