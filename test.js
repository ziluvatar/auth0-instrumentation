var env = {'NODE_ENV': 'production'};
var pkg = {'name': 'foo'};
var logger = require('./index')(pkg, env).logger;
logger.error("WHOA");
