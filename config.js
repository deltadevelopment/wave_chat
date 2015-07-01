'use strict';

var config = {
  debug: true,
  backlog: {
    hard: 100,      // How long message history do we keep in Redis
    soft: 5         // How much do we allow the users to see
  },
  message: {
    backlog: 100,
    showlog: 5
  },
  server: {
    id: 1, // Math.floor((Math.random() * 100) + 1),
    heartbeat: 10,  // How often do we have to let the other servers know we're alive before we're killed? In seconds.
    killtime: 5,   // How long after a missing heartbeat before we remove a gone server, and if nessecary elect a new master? In seconds.
                  // Note: Kills only happen on multiples of heartbeat.
    port: 1234
  },
  api: {
    endpoint: 'https://ddev-wave-staging.herokuapp.com'
  },
  ssl: {
    key: '',
    cert: ''
  }
};

console.log('Server ID: %s', config.server.id);

module.exports = config;
