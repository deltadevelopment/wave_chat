var secret = require('./.secret');

var config = {
  socket: 42326,
  db_host: "wave-chat.cotsyfcel8ra.eu-west-1.rds.amazonaws.com",
  db_name: secret.db_name,
  username: secret.username,
  password: secret.password
};

module.exports = config;
