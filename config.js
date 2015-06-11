var secret = require('./.secret');

var config = {
  port: 42326,
  dbHost: "wave-chat.cotsyfcel8ra.eu-west-1.rds.amazonaws.com",
  dbName: secret.db_name,
  username: secret.username,
  password: secret.password,

  // Wave Backend
  apiHost: "http://localhost:3000"
};

module.exports = config;
