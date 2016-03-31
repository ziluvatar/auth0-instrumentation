var env = {'NODE_ENV': 'production', 'IGNORE_PROCESS_INFO': true};
var pkg = {'name': 'foo'};
var agent = require('./index');

agent.init(pkg, env);
agent.logger.error("WHOA");
