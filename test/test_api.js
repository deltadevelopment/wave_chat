var api = require('../api');
var chai = require('chai');
var _ = require('underscore');
chai.should();

// TODO: Tests must be rewritten with stubs

describe("#getUserByAuthToken", function(){
  it("returns a username for a token", function(done){
    var token = "599269a04836fca23195b1c8f8ac943a"

    api.getUserByAuthToken(token, function(res){
      res.hasOwnProperty("username").should.equal(true);                    
      console.log(res);
      done();
    });

  });

  it("returns an empty object with incorrect token", function(done){
    var token = "A";

    api.getUserByAuthToken(token, function(res){
      res.hasOwnProperty('username').should.equal(true);
    });
  });

  it("test", function(){

    array = [1,2,3];

    array = _.without(array, 1);

  });

});
