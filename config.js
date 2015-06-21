var config = {
  backlog {
    hard: 100,      // How long message history do we keep in Redis
    soft: 5         // How much do we allow the users to see
  },
  server {
    heartbeat: 30,  // How often do we have to let the other servers know we're alive before we're killed?
  }
};

module.exports = config;
