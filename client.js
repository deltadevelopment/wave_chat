'use strict';

var _ = require('underscore');
var api = require('./core/api.js');

/* eslint-disable no-process-exit */

var net = require('net');
var config = require('./config.js');

if (_.contains(process.argv, '--alt')) {
  console.log('meep');
  config.server.port = 4444;
}

var connected = false;
console.log('Connecting ...');
var client = net.connect(1234, 'ec2-52-18-5-223.eu-west-1.compute.amazonaws.com', function () {
  connected = true;
  console.log('Connected!');
});

client.on('data', function(data) {
  console.log('\n<--DATA-->');
  console.log(data.toString());
  console.log('\n</--DATA-->');
});

client.on('end', function() {
  console.log('Disconnected from server.');
  process.exit();
});

client.on('error', function(data) {
  console.log('An error occured: %s', data);
  process.exit();
});

function doAuth(params) {
  switch (params[0]) {
    case '1':
      params[1] = 'testuser1';
      break;
    case '2':
      params[1] = 'testuser2';
      break;
    case '3':
      params[1] = 'testuser3';
      break;
  }

  api.login(params[1], params[1], function(authToken, uid) {
    if (authToken === null) {
      console.log('Username/password wrong');
      return;
    }

    console.log('Got token: %s', authToken);
    console.log('UID: %s', uid);

    client.write(JSON.stringify({
      command: 'auth',
      params: {
        userid: uid,
        token: authToken
      }
    }));
  });
}

function doJoin(params) {
  client.write(JSON.stringify({
    command: 'join',
    params: {
      bucket: params[0]
    }
  }));
}

function doPart(params) {
  client.write(JSON.stringify({
    command: 'part',
    params: {
      bucket: params
    }
  }));
}

function doSend(params) {
  client.write(JSON.stringify({
    command: 'send',
    params: {
      bucket: params[0],
      message: params.splice(1).join(' ')
    }
  }));
}


process.stdin.on('data', function(textLine) {
  textLine = textLine.toString();
  if (textLine.length === 0) {
    return;
  }

  if (textLine[textLine.length - 1] === '\n') {
    textLine = textLine.substr(0, textLine.length - 1);
  }

  var params = textLine.split(' ');
  var command = params.splice(0, 1)[0];
  params = params;

  if (textLine !== 'quit' && connected === false) {
    console.log('Can\'t execute commands while not connected.');
    return;
  }

  switch (command) {
    case 'quit':
      process.exit();
      break;
    case 'auth':
      doAuth(params);
      break;
    case 'join':
      doJoin(params);
      break;
    case 'part':
      doPart(params);
      break;
      case 'send':
        doSend(params);
        break;
    default:
      console.log('Unknown command: %s', textLine);
      break;
  }
});
