var api = require('../api');
var chai = require('chai');
var _ = require('underscore');
chai.should();

// TODO: Tests must be rewritten with stubs

describe("#getUserByAuthToken", function(){
  it("returns a username for a token", function(done){
    var token = "5515010e19c447e9eb44dcbc2ce41624"

    api.getUserByAuthToken(token, function(res){
      res.hasOwnProperty("username").should.equal(true);                    
      done();
    });

  });

  it("returns an empty object with incorrect token", function(done){
    var token = "A";

    api.getUserByAuthToken(token, function(res){
      res.hasOwnProperty('username').should.equal(false);
      done();
    });
  });

});
