var session = require('../session.js'); 
var expect = require('chai').expect;
var sinon = require('sinon');
var api = require('../api');

// describe("#isAuth", function(){
// 
//   it("returns true if client is authenticated");
// 
// });
// 
// describe("#doAuth", function(){
//   
//   it("adds a client to the sessionList if the token exists", function(done){
//     var count = session.getSessionList.length;
//     var stub = sinon.stub(api, "getUserByAuthToken");
// 
//     session.doAuth({}, "AAA", function(){
//       expect(session.getSessionList).to.have.length(count+1);
//       done();
//     });
//   });
// 
//   it("returns false if the client was not added to the list", function(){
//     session.doAuth({}, "A", function(res){
//       expect(res).to.be(false);
//       done();
//     });
//   });
// 
// });
