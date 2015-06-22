var redis = require('ioredis');
var config = require('../config.js');

var db = new redis(config.redisConn);

module.exports = db;
