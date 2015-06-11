var _ = require('underscore')
var Redis = require('ioredis')
var redis = new Redis();

/*
{
  members: [],
  ???
}


{
    userId: ABCD,
    joined: TS,
    ??
}
 */

/*function chanMan()
{
  redis.subscribe('channel', function(err, count)) {
    if (err != null)
      console.error('Failed to subscribe to Redis!');
  }
}*/



function chan(chanId) {
  this.chanId = chanId;
  this.chanJson = undefined;
  this.load();
}

/** Check if a member is in the channel */
chan.prototype.hasMember = function(memberId) {
  if (this.chanJson === undefined)
    return false;

    return (_.find(this.chanJson.members, function(obj) {
      return obj.userId == memberId;
    }) != undefined);
}

/** Adds a member to the channel */
chan.prototype.addMember = function(memberId) {
  if (this.chanJson === undefined)
    return;
  this.chanJson.members.push({ userId: memberId, joined: null } )
}

/** Deletes a member from the channel */
chan.prototype.delMember = function(memberId) {
  if (this.chanJson === undefined)
    return;

    this.chanJson = _.without(this.chanJson, memberId);
}

/** Saves channel information to the database */
chan.prototype.save = function() {
  redis.set('channel.' + this.chanId, JSON.stringify(this.chanJson));

  // TODO: Calculate and set expiry
}

/** Loads channel information from database */
chan.prototype.load = function() {
  var that = this;

  redis.get('channel.' + this.chanId, function(error, data) {
    if (error != null) {
      // Uh oh ....
      return;
    }

    that.chanJson = JSON.parse(data);
    if (data != null && data != undefined)
      return;

    that.chanJson = {
      members: new Array(),
    };
  });
}

var c = new chan('test');
setTimeout(function() {
console.log('Does the user have the member? ' + c.hasMember('testmember'));
//c.addMember('testmember');
//c.delMember('testmember');
//c.save();
//console.log(c.hasMember('testmember'));
//c.delMember('testmember');
//console.log(c.hasMember('testmember'));
}, 100);

//console.log(c.hasMember('testmember'));


///module.exports = chan;
