function _getErrorCatcher(pkg, env) {
  if (!env['USE_NEWRELIC']) {
    return { catch: function() {} };
  }

  if (env['NEW_RELIC_NO_CONFIG_FILE']) {
    process.env['NEW_RELIC_NO_CONFIG_FILE'] = true;
    process.env['NEW_RELIC_APP_NAME'] = pkg.name;
    if (env['NEW_RELIC_LICENSE_KEY']) {
      process.env['NEW_RELIC_LICENSE_KEY'] = env['NEW_RELIC_LICENSE_KEY'];
    }
  }
  return require('./lib/error_catcher');
}


module.exports = function(pkg, env) {
  return {
    logger: require('./lib/logger')(pkg, env),
    errorCatcher: _getErrorCatcher(pkg, env)
  };
};