'use strict';

var error = {};

error.make = function(numeric, message) {
  var retObj = {
    error: {
      numeric: numeric,
      message: message
    }
  };
  return retObj;
};

error.do = function(client, numeric, message) {
  console.log('Error: %s. Disconnecting client %s', message, client.remoteAddress);
  var errorObj = error.make(numeric, message);
  client.write(JSON.stringify(errorObj));
  client.end();
};

module.exports = error;
