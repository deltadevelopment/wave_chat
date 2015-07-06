'use strict';



var error = {};

/**
  * Make an error object containing a numeric and a message
  *
  * @method make
  * @param {Integer} numeric The error's numeric
  * @param {String} message The error's message
  */
error.make = function(numeric, message) {
  var retObj = {
    error: {
      numeric: numeric,
      message: message
    }
  };
  return retObj;
};

/**
  * Notify a client about an error and quit it
  *
  * @method do
  * @param {Object} client The user's client object
  * @param {Integer} numeric The error's numeric
  * @param {String} message The error's message
  */
error.do = function(client, numeric, message) {
  console.log('Error: %s. Disconnecting client %s', message, client.remoteAddress);
  var errorObj = error.make(numeric, message);
  client.write(JSON.stringify(errorObj));
  client.end();
};

module.exports = error;
