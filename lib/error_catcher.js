var newrelic = require('newrelic');

module.exports = {
  catch: function(err) {
    return newrelic.noticeError(err);
  }
};