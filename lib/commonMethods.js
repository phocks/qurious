// Meteor methods can be called by the client to do server things
// They can also be called by the server, I think... maybe, yes they can
Meteor.methods({


// This is no longer the currect method. Please use addQuoteToPage
// addQuote: function (text, attribution) {
//   // Make sure the user is logged in otherwise throw and error
//   if (! Meteor.userId()) throw new Meteor.Error("not-authorized");

//   if (text.length > maximumQuotationLength) throw new Meteor.Error('too-long');

//   // Counters.update({ _id: 'quote_id' }, { $inc: { seq: 1 } });

//   // var counter = Counters.findOne({ query: { _id: 'quote_id' } });

//   var newQuote = Quotes.insert({
//     attribution: attribution,
//     quotation: text,
//     createdAt: new Date(), // current time
//     username: Meteor.user().username, // username of quote
//     userId: Meteor.userId(),  // _id of logged in user
//     // quote_id: counter.seq.toString()
//   });

//   return newQuote;
// },







// Will use viewQuote instead probably
// incQuoteViewCounter: function(quoteId) {
//   Quotes.update( { _id: quoteId }, {$inc: { views: 1 } });
// },



// testing ip getting on the client side
// will be null if not behind a proxy as set in process.env.HTTP_FORWARDED_COUNT = 2;
/*getClientIp: function() {
  clientIp = this.connection.clientAddress;
  console.log("Client IP is: " + clientIp);
},-------------------doesn't work with client so deleting*/



// Brought back from the dead, this function












// This is a feature to "Like" a quotation. It should put the quote in the user's
// likes list and then update the upcount in the quote db
// If a user has already like the quote, this function also "Unlikes" it
// Added: this method will also add username to an array in the quote doc
dogearQuote: function (quoteId) {
  if (Meteor.userId()) { // Only process if user logged in

    // Looks for quoteId in Users collection
    var user = Meteor.users.findOne({_id:this.userId, liked:{$ne:quoteId}})

    // Test to see if user has already dogeared this quote
    if (!user) { // returns null or undefined

      // Old way, no time stamp
      Meteor.users.update({_id:this.userId},{ $pull:{liked:quoteId} });

      // New way with timestamp
      Meteor.users.update({_id:this.userId},{ $pull:{ dogeared: { quoteId: quoteId } }},
        { multi: true });

      // Even newer way, dogearing removes username from the quote
      Quotes.update({ _id: quoteId }, { $pull: { usersWhoDogeared: Meteor.user().username } });


      Quotes.update( { _id: quoteId }, {$inc: { upcount: -1 } });

      return false; // exits the function
    }

    // Otherwise dogear this quote below

    console.log("user " + this.userId + " collected the quote " + quoteId );

    Quotes.update( { _id: quoteId }, {$inc: { upcount: 1 } });
    Meteor.users.update({_id:this.userId},{ $addToSet:{liked:quoteId} });

    // New Dogear feature that adds date as well
    Meteor.users.update({ _id: this.userId },
      { $push: { dogeared: { quoteId: quoteId, dogearedAt: new Date() }}});

    // Even newer way, dogearing adds username to the quote
    Quotes.update({ _id: quoteId }, { $addToSet: { usersWhoDogeared: Meteor.user().username } });


    return true;
  }
},

updateFullName: function (fullName) {
  if (Meteor.userId()) {
    console.log("updating pen name to: " + fullName);
    // Profiles.upsert( { rootId: Meteor.userId() } ,{ $set: {name: penName, rootId: Meteor.userId() }} );
    Meteor.users.update( { _id: Meteor.userId() }, { $set:{"profile.fullName": fullName }} );
  }
},

// This will be useful to log in as other users but please implement security via roles
logmein: function(user_id_to_log_in_as) {
  var loggedInUser = Meteor.user();

  if (!Roles.userIsInRole(loggedInUser, ['admin'])) { 
    console.log('not authorized');
    return false;
  }


  if (Meteor.isServer) {
    this.setUserId(user_id_to_log_in_as);
  }
  if (Meteor.isClient) {
    Meteor.connection.setUserId(user_id_to_log_in_as);
  }
},



});  // end meteor methods