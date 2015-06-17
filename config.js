var secret = require('./.secret');

var config = {
  serverId: 1,
  storeMessages: 1000,  // How long should our internal message backlog for each channel be?
  sendMessages: 5,      // How many messages should the user receive.
  redisConn: undefined,
  port: 42326,
  host: '',
  backlog: 0,
  sslKey: './ssl/key.key',
  sslCert: './ssl/cert.crt',
  dbHost: "wave-chat.cotsyfcel8ra.eu-west-1.rds.amazonaws.com",
  dbName: secret.db_name,
  username: secret.username,
  password: secret.password,

  // Wave Backend
  apiHost: "http://localhost:3000"
};

module.exports = config;
