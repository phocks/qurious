// Meteor methods can be called by the client to do server things
// They can also be called by the server, I think... maybe, yes they can
Meteor.methods({


// This is no longer the currect method. Please use addQuoteToAuthor
addQuote: function (text, attribution) {
  // Make sure the user is logged in otherwise throw and error
  if (! Meteor.userId()) throw new Meteor.Error("not-authorized");

  if (text.length > maximumQuotationLength) throw new Meteor.Error('too-long');

  // Counters.update({ _id: 'quote_id' }, { $inc: { seq: 1 } });

  // var counter = Counters.findOne({ query: { _id: 'quote_id' } });

  var newQuote = Quotes.insert({
    attribution: attribution,
    quotation: text,
    createdAt: new Date(), // current time
    username: Meteor.user().username, // username of quote
    userId: Meteor.userId(),  // _id of logged in user
    // quote_id: counter.seq.toString()
  });

  return newQuote;
},



addQuoteToPage: function (text, pageId) {
  // Make sure the user is logged in otherwise throw and error
  if (! Meteor.userId()) throw new Meteor.Error("not-authorized");

  // Please make this error actually do something
  if (text.length > maximumQuotationLength) throw new Meteor.Error('too-long');

  var n = 5;
  var shortenedText = text.replace(/\s+/g," ").split(/(?=\s)/gi).slice(0, n).join('');
  shortenedText = shortenedText.replace(/[^a-zA-Z\d\s]/g, ""); // remove special chars as well

  var quoteSlug = slugify(shortenedText);


  var newQuote = Quotes.insert({
    pageId: pageId,
    quotation: text,
    createdAt: new Date(), // current time
    // username: Meteor.user().username, // username of whoever created quote
    createdBy: Meteor.userId(),  // _id of logged in user
    slug: quoteSlug,
  }, function(error, result) {
    if (error) {
      console.log("Something went wrong trying to insert into the DB: " + error.message);
      return result;
    }
  });

  return newQuote;
},


deleteQuote: function(quoteId) {
  Quotes.remove(quoteId);
},



// Will use viewQuote instead probably
// incQuoteViewCounter: function(quoteId) {
//   Quotes.update( { _id: quoteId }, {$inc: { views: 1 } });
// },

// Here we are going to check the size of the quote and then
// set a value to it so that we can display long quotes with smaller font
// etc etc

// I don't think we are doing this any more
checkQuoteSize: function(quoteId) {

  check(quoteId, String);

  var currentQuote = Quotes.findOne(quoteId);
  var quotation = currentQuote.quotation;

  //console.log(currentQuote.length);

  if (true) { // use currentQuote.length == undefined to only update undefined
    var n = quotation.length;

    if (n > maximumQuotationLength) return false; // i don't like massive quotes and i cannot lie

    if (n <= 40) Quotes.update({ _id: quoteId }, { $set: { length: 'tiny' }});
    if (n > 40 && n <= 120) Quotes.update({ _id: quoteId }, { $set: { length: 'short' }});
    if (n > 120 && n <= 300) Quotes.update({ _id: quoteId }, { $set: { length: 'medium' }});
    if (n > 300 && n <= 500) Quotes.update({ _id: quoteId }, { $set: { length: 'long' }});
    if (n > 500) Quotes.update({ _id: quoteId }, { $set: { length: 'gigantic' }});
  }

  return true;
},

// testing ip getting on the client side
// will be null if not behind a proxy as set in process.env.HTTP_FORWARDED_COUNT = 2;
/*getClientIp: function() {
  clientIp = this.connection.clientAddress;
  console.log("Client IP is: " + clientIp);
},-------------------doesn't work with client so deleting*/



// Brought back from the dead, this function





addPage: function(pageName) {
  // Make sure the user is logged in before inserting a task
  if (! Meteor.userId()) {
    throw new Meteor.Error("not-authorized");
  }

  // We wanted to have the slug as something the URL defines
  function slugText(text)
  {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

  pageSlug = slugText(pageName);

  var newPageId = Pages.insert({
      name: pageName,
      slug: pageSlug,
      createdAt: new Date(), // current time
      createdBy: Meteor.userId(), // current user
    }, function(error, result) {
      if (error) {
        console.log(error);
        return false;
      }
      else console.log(result);
      Meteor.users.update( { _id: Meteor.userId() }, { $addToSet:{"profile.pages": result }} );
    });



    return pageSlug;
},






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
}

});  // end meteor methods
