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
  case 'join':
    console.log(params);
      doJoin(params);
    break;
    default:
      console.log('Unknown command: %s', textLine);
      break;
  }
});

function doJoin(params) {
  client.write({
    command: 'join',
    params: {
      channel: params[0]
    }
  });
}
