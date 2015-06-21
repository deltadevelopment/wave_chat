
var userManager = { };

userManager.remoteDuck = {
  uuid: null,
  uid: null,
  server: null
}

userManager.localDuck = {
  client: null
}
userManager.localDuck.prototype = userManager.remoteDuck;

var localUsers = new Array();

// Local users
userManager.addLocalUser = function() {

}

userManager.remLocalUser = function() {

}

userManager.hasLocalUser = function() {

}

// Remote users
userManager.hasRemoteUser = function() {

}

// Both
userManager.addUser = function() {

}

userManager.remUser = function() {

}

userManager.hasUser = function() {

}

userManager.isLocal = function() {

}
