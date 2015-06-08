require('mocha');
require('should');

var stuff = require('../index.js');

describe('Money', function(){
  describe('#giveMeMoney', function(){
    it('should give me 500 in cash', function(){
      var money = stuff.giveMeMoney();
      money.should.equal(500)
    });
  });
});
