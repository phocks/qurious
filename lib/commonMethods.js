// Imports need to be in every file I think....
import slug from 'slug';

// Meteor methods can be called by the client to do server things
// They can also be called by the server, I think... maybe, yes they can
Meteor.methods({





// This is a feature to "Like" a quotation. It should put the quote in the user's
// likes list and then update the upcount in the quote db
// If a user has already like the quote, this function also "Unlikes" it
// Added: this method will also add username to an array in the quote doc
// DEPRECIATED BUT USE THIS TO BUILD A LIKE SYSTEM LATER
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



// This will be useful to log in as other users but please implement security via roles
logmein: function (user_id_to_log_in_as) {
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
  console.log("Probably logged in as " + Meteor.user().username);
},


updatePage: function (pageSlug, pageName) {
  // Make sure the user is logged in
  if (! Meteor.userId()) {
    throw new Meteor.Error("not-authorized");
  }

  console.log("Updating: " + pageName);

  Pages.update({ slug: pageSlug }, { $set: { name: pageName } });
},



addPage: function(pageName) {
  
    // Make sure the user is logged in before inserting a task
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    pageName = toTitleCase(pageName); // these are defined in globalFunctions.js


    console.log(slug(pageName)); // yep it works
    pageSlug = slug(pageName);// old code: slugText(pageName); // these are defined in globalFunctions.js

    var page = {
      name: pageName,
      slug: pageSlug,
      createdAt: new Date(), // current time
      createdBy: Meteor.userId(), // current user
    };


    const newPage = Pages.insert(page, function(error, result) {
      if (error) {
        console.log(error);
        throw new Meteor.Error( 500, 'There was an error processing your request :(' );
      }
      else {
        console.log(result);

        var pageId = result;
        // This put the new page in the user profile. Probably don't do that right now.
        // Meteor.users.update( { _id: Meteor.userId() }, { $addToSet:{"profile.pages": result }} );

        // Update time of last submission
        Meteor.users.update( { _id: Meteor.userId() }, { $set:{"profile.lastSubmissionTime": new Date() }} );
      }
    });

    return newPage;
  },



addQuoteToPage: function (quotationText, authorText, pageSlug) {
  // Make sure the user is logged in otherwise throw and error
  if (! Meteor.userId()) throw new Meteor.Error("not-authorized");

  // Please make this error actually do something
  if (quotationText.length > maximumQuotationLength) throw new Meteor.Error('too-long');

  var n = 5;
  var shortenedText = quotationText.replace(/\s+/g," ").split(/(?=\s)/gi).slice(0, n).join('');
  shortenedText = shortenedText.replace(/[^a-zA-Z\d\s]/g, ""); // remove special chars as well

  var quoteSlug = slug(shortenedText);
  


  var newQuote = Quotes.insert({
    pageSlugs: [pageSlug],
    quotation: quotationText,
    author: authorText,
    createdAt: new Date(), // current time
    username: Meteor.user().username, // username of whoever created quote
    createdBy: Meteor.userId(),  // _id of logged in user
    slug: quoteSlug,
  }, function(error, result) {
    if (error) {
      console.log("Something went wrong trying to insert into the DB: " + error.message);
      return result;
    }
  });

  return quoteSlug; // Returns the _id of new quote
},




});  // end meteor methods