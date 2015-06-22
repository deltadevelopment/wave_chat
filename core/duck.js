var _ = require('underscore');
var util = require('util');

/**
  * This class is mostly for use in the development phase.
  * Only use these in an if (debug) block.
  * @class Duck
  */
var duck = { };

/**
  * Check if an object contains a set of properties.
  * @method duckTest
  * @param {Object} duckObject The object to check
  * @param {Object} requiredFields Fields the object must contain
  * @param {Boolean} [allowInheritance=false] Check the prototype chain as well as the object
  */
duck.duckTest = function(duckObject, requiredFields, allowInheritance) {
  for (currentField in requiredFields) {
    if (allowInheritance == true) {
      if (currentField in duckObject || currentField === 'prototype')
        continue;
      return false;
    } else {
      if (duckObject.hasOwnProperty(currentField))
        continue;
      return false;
    }
  }
  return true;
}

/**
  * Throw an error if an object does not contain a set if properties.
  * @method ensureDuck
  * @param {Object} duckObject The object to check
  * @param {Object} requiredFields Fields the object must contain
  * @param {Boolean} [allowInheritance=false] Check the prototype chain as well as the object
  */
duck.ensureDuck = function(duckObject, requiredFields, allowInheritance) {
  if (helpers.duckTest(duckObject, requiredFields, allowInheritance))
    return;
  throw new Error(util.format('Missing field in object %j', duckObject));
}

module.exports = duck;
