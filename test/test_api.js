var api = require('../api');
var Promise = require('bluebird');

describe("#getUserByAuthToken", function(){
  it("returns a username for a token", function(){
    var token = "599269a04836fca23195b1c8f8ac943a"

    api.getUserByAuthToken(token, function(err, res){
      res.username.should.equal("username");
    });

  });

  it("returns null for non-existing tokens", function(){
    var token = "AAAAA"

    var res = Promise.try(function(){
      return api.getUserByAuthToken(token); 
    }).then(function(res){
      return res;
    });

    res.should.equal(null);

});
