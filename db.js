var Redis = require('ioredis')
var config = require('./config.js')

var db = {
  redis: new Redis(config.redisConn)
};

/*
db.redis.rpush('test:list', 'test');
db.redis.ltrim('test:list', 0, 4);
db.redis.lrange('test:list', 0, -1, function(err, data) {
  console.log(data);
});

db.redis.lrem('test:list', 0, 'test', function(err, data) {
  console.log(data);
});*/

module.exports = db;
