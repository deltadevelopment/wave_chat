var assert = require('assert');
var redis = new (require('ioredis'));
var userManager = require('./core/usermanager.js');
var config = require('./config.js');
var _ = require('underscore');
var util = require('util');

config.debug = false;

// As our code is haveily dependent on Redis, clear it the redis database first
redis.flushall();
/* eslint-disable */
describe('UserManager', function() {
  var testClientObjArr = [
    { name: 'TestObj1' },
    { name: 'TestObj2' },
    { name: 'TestObj3' }
  ];

  var bogoClientObjArr = [
    { name: 'TestObj100' },
    { name: 'TestObj200' },
    { name: 'TestObj300' }
  ];

  describe('#addLocalUser()', function() {
    it('should add several users without errors', function(done) {
      var callbacksReceived = 0;
      var i;
      for (i in testClientObjArr) {
        userManager.addLocalUser(testClientObjArr[i], testClientObjArr[i].name, function(success) {
          assert.equal(success, true);

          ++callbacksReceived;
          if (callbacksReceived == testClientObjArr.length) {
            done();
          }
        });
      }
    });
  });

  describe('Data-backing', function() {
    it('should have an obj-entry in the db', function(done) {
      var callbacksReceived = 0;
      function askRedis(currentIndex) {
        redis.get(util.format('session:obj:%s', testClientObjArr[currentIndex].name), function(err, data) {
          if (err) {
            throw err;
          }
          data = JSON.parse(data);
          var curTestObj = testClientObjArr[currentIndex];
          assert.equal(data.uid, curTestObj.name);
          assert.equal(config.server.id, data.server);

          ++callbacksReceived;
          if (callbacksReceived === testClientObjArr.length) {
            done();
          }
        });
      }

      var i;
      for (i in testClientObjArr) {
        askRedis(i);
      }
    });

    it('should have a reference in the local-server-user set', function(done) {
      var callbacksReceived = 0;
      function askRedis(currentIndex) {
        redis.sismember(util.format('server:%s:users', config.server.id), testClientObjArr[currentIndex].name, function(err, data) {
          assert.equal(data, 1);

          ++callbacksReceived;
          if (callbacksReceived === testClientObjArr.length) {
            done();
          }
        });
      }

      var i;
      for (i in testClientObjArr) {
        askRedis(i);
      }
    });

    it('should have a reference in the global-user set', function(done) {
      var callbacksReceived = 0;
      function askRedis(currentIndex) {
        redis.sismember('session:ref', testClientObjArr[currentIndex].name, function(err, data) {
          assert.equal(data, 1);

          ++callbacksReceived;
          if (callbacksReceived === testClientObjArr.length) {
            done();
          }
        });
      }

      var i;
      for (i in testClientObjArr) {
        askRedis(i);
      }
    });

    it('should not have references to unknown items in the local-server-user set', function(done) {
      redis.smembers(util.format('server:%s:users', config.server.id), function(err, data) {
        if (err) {
          throw err;
        }

        assert.equal(testClientObjArr.length, data.length);
        done();
      });
    });

    it('should not have references to unknown items in the global-user set', function(done) {
      redis.smembers('session:ref', function(err, data) {
        if (err) {
          throw err;
        }

        assert.equal(testClientObjArr.length, data.length);
        done();
      });
    });
  });

  describe('#findLocalUser()', function() {
    it('should find all users inserted when looking for them', function() {
      var i;
      for (i in testClientObjArr) {
        assert.notEqual(userManager.findLocalUser(testClientObjArr[i].name), null);
      }
    });

  });

  describe('#getLocalUsers()', function() {
    it('should not find any users not provided when getting a copy of the internal user map', function() {
      var localUserArray = userManager.getLocalUsers();

      var i;
      for (i in localUserArray) {
        assert.equal(_.contains(testClientObjArr, localUserArray[i].client), true);
      }
    });
  });

  describe('#addWaitingAuth', function() {
    it('should add without problems', function() {
      _.each(testClientObjArr, userManager.addWaitingAuth)
    });
  });

  describe('#isWaitingAuth', function() {
    it('should return true for items that are pushed', function() {
      _.each(testClientObjArr, function(item) {
        assert.equal(userManager.isWaitingAuth(item), true);
      });
    });

    it('should return false for items that aren\'t pushed', function() {
      _.each(bogoClientObjArr, function(item) {
        assert.equal(userManager.isWaitingAuth(item), false);
      });
    })
  });

  describe('#remWaitingAuth', function() {
    it('should remove without problems', function() {
      _.each(testClientObjArr, function(item) {
        userManager.remWaitingAuth(item);
        assert.equal(userManager.isWaitingAuth(item), false);
      });
    });
  });

  describe('#findSession()', function() {
    it('should find sessions for all added users', function() {
      _.each(testClientObjArr, function(item) {
        assert.notEqual(userManager.findSession(item), null);
      });
    });

    it('should not find sessions for users not added', function() {
      _.each(bogoClientObjArr, function(item) {
        assert.equal(userManager.findSession(item), null);
      });
    });
  });

  describe('#getSessions', function() {
    var requestSessions = [];
    _.each(testClientObjArr, function(item) {
      requestSessions.push(item.name);
    });

    _.each(bogoClientObjArr, function(item) {
      requestSessions.push(item.name);
    });

    var sessionList;
    it('should get the session list without errors', function(done) {
      userManager.getSessions(requestSessions, function(sessList) {
        sessionList = sessList;
        done();
      });
    });

    it('should contain sessions for our valid test objects', function() {
      _.each(testClientObjArr, function(item) {
        assert.notEqual(_.find(sessionList, function(cmpObj) {
          return (item.name === cmpObj.uid);
        }), undefined);
      });
    });

    it('should not contain sessions for our invalid test objects', function() {
      _.each(bogoClientObjArr, function(item) {
        assert.equal(_.find(sessionList, function(cmpObj) {
          return (item.name === cmpObj.uid);
        }), undefined);
      });
    });
  });

  describe('#findUser', function() {

    it('should find valid, local sessions for all valid test objects', function(done) {
      var callbacksReceived = 0;
      _.each(testClientObjArr, function(item) {
        userManager.findUser(item.name, function(userObj, isLocal) {
          assert.notEqual(userObj, null);
          assert.equal(isLocal, true);

          ++callbacksReceived;
          if (callbacksReceived === testClientObjArr.length) {
            done();
          }
        });
      });
    });

    it('should not find sessions for any invalid test object', function(done) {
      var callbacksReceived = 0;
      _.each(bogoClientObjArr, function(item) {
        userManager.findUser(item.name, function(userObj, isLocal) {
          assert.equal(userObj, null);
          assert.equal(isLocal, undefined);

          ++callbacksReceived;
          if (callbacksReceived === bogoClientObjArr.length) {
            done();
          }
        });
      });
    });
  });
});
