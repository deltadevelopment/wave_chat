var Redis = require('ioredis');
var config = require('../config.js');

var db = new Redis(config.redisConn);

module.exports = db;
