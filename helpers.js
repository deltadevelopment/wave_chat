var session = require('./session.js');

var helpers = { };

helpers.getObjectId = function(objRef) {
  if (typeof objRef === 'string')
    return objRef;
  if (typeof objRef !== 'object')
    throw new Error('Variable of unexpected type');
  if (!objRef.hasOwnProperty('id'))
    throw new Error('Object did not contain an \'id\' field');
  if (typeof objRef.id !== 'string')
    throw new Error('id field of unexpected type');
  return objRef.id;
}

helpers.createError = function(numeric, message, stringify) {
  var errorObj = {
    error: {
      numeric: numeric,
      message: message
    }
  };

  if (stringify === true)
    return (JSON.stringify(errorObj));
  return errorObj;
}


module.exports = helpers;
