var env = {'NODE_ENV': 'production', 'NEW_RELIC_LICENSE_KEY': '4729789e843610944a63f6f7d69e1984b14ae61d', 'NEW_RELIC_NO_CONFIG_FILE': true, 'USE_NEWRELIC': true};
var pkg = {'name': 'foo'};
var agent = require('./index')(pkg, env);

agent.logger.error("WHOA");

var err = new Error('My app did something weird! I need this logged with traceback.');
agent.errorCatcher.catch(err);
agent.logger.error(err);