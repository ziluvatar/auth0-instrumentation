module.exports = function(pkg, env) {
	return {
		logger: require('./lib/logger')(pkg, env)
	};
};