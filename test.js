var env = {'NODE_ENV': 'production'};
var pkg = {'name': 'foo'};
var agent = require('./index');

agent.init(pkg, env);
agent.logger.error("WHOA");
