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
  api_key: process.env.CHAT_API_KEY

  // Wave Backend
  apiHost: "https://w4ve.herokuapp.com"
};

module.exports = config;
