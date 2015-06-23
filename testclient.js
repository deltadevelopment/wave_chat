var net = require('net');
var util = require('util');
var config = require('./config.js');

var connected = false;
console.log('Connecting ...');
var client = net.connect(config.port, function () {
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

process.stdin.on('data', function(textLine) {
  textLine = textLine.toString();
  if (textLine.length == 0)
    return;

  if (textLine[textLine.length - 1] == '\n')
    textLine = textLine.substr(0, textLine.length - 1)

  var params = textLine.split(' ');
  var command = params.splice(0, 1)[0];
  params = params;

  if (textLine != 'quit' && connected == false) {
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

function doAuth(params) {
  switch (params[0]) {
    case '1':
      params[0] = 'fcedcd2d6895f5796cfd59899df3b6c9';
      break;
    case '2':
      params[0] = '1f78d9178ac5ff544469df8d446be8eb';
      break;
    case '3':
      params[0] = '3c47e9adfd018f88c1c76272f9fb2db1';
      break;
  }

  client.write(JSON.stringify({
    command: 'auth',
    params: {
      authToken: params[0],
    }
  }));
}

function doJoin(params) {
  client.write(JSON.stringify({
    command: 'join',
    params: {
      bucket: params
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
