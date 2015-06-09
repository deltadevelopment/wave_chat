var api = require('../api');

describe("#getUserByAuthToken", function(){
  it("returns a username for a token", function(){
    var token = "599269a04836fca23195b1c8f8ac943a"

    api.getUserByAuthToken(token, function(res){
      res.username.should.equal("username");
    });

  });
});
