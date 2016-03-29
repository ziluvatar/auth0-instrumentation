module.exports = function(env) {
  // module forever-agent has an issue https://github.com/request/forever-agent/blob/master/index.js#L70
  // it doesn't always use free sockets, which accumulates sockets when using kinesis which sets useChunkedEncodingByDefault to true
  var mod = env['NODE_ENV'] === 'production' ? require('https') : require('http');

  // using separate engines even if a collection is kept per host:post
  // to be able to change settings separately
  var agents = new Map();

  return function getAgent(name){
    var agent = agents.get(name);
    if (!agent){
      agents.set(name, new mod.Agent({
        keepAlive: true
      }));
    }

    return agent;
  };
};
