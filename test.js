var env = {'NODE_ENV': 'production', 'NEW_RELIC_LICENSE_KEY': '123123', 'NEW_RELIC_NO_CONFIG_FILE': true, 'USE_NEWRELIC': true};
var pkg = {'name': 'foo'};
var agent = require('./index')(pkg, env);

agent.logger.error("WHOA");

var err = new Error('My app did something weird! I need this logged with traceback.');
agent.errorCatcher.catch(err);