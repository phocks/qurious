// These Meteor methods only run on the server. This is useful to hide things from the client.
// Things like database changes that the client might do latency compensation on are especially
// useful to hide from the client.

// Trying out a new npm package we are able to in Meteor 1.3 sweet
import slug from 'slug';
// slug('string', [{options} || 'replacement']);
slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};


Meteor.methods({

  // Throw the dice with all the db docs
	getRandomQuoteId: function() {
    var count = Quotes.find().count();
    var random_index = Math.floor(Math.random() * (count));
    var random_object = Quotes.findOne({}, {skip:random_index});
    return random_object._id;
  },

  getRandomQuoteIdShort: function() {
    var count = Quotes.find().count();
    var random_index = Math.floor(Math.random() * (count));
    var random_object = Quotes.findOne({}, {skip:random_index});
    return random_object.quote_id;
  }, 
  // ps. look at the Random function built-in to Meteor alternatively


  // Throw the dice with all the db docs
  getRandomQuoteIdWithWord: function(word) {      
    var count = Quotes.find({quotation: { '$regex': word, $options: 'i'}}).count();
    var random_index = Math.floor(Math.random() * (count));
    var random_object = Quotes.findOne({quotation: { '$regex': word, $options: 'i'}}, {skip:random_index});
    if (random_object !== undefined) return random_object._id;
    else return false;
  },


  getRandomQuoteIdWithStringAllFields: function(word) {      
    var count = Quotes.find({quotation: { '$regex': word, $options: 'i'}}).count();
    var random_index = Math.floor(Math.random() * (count));
    var random_object = Quotes.findOne({ $or: [ { quotation: { '$regex': word, $options: 'i'}},
                                                { author: { '$regex': word, $options: 'i'}} ]},
                                                {skip:random_index}
                                              );
    if (random_object !== undefined) return random_object._id;
    else return false;
  },




  // $or: [ { quotation: { '$regex': terms_to_lookup, $options: 'i'} },
//             { attribution: { '$regex': terms_to_lookup, $options: 'i'}} ]




  // Like random, now with less randomness!
  getLuckyQuoteId: function() {
    var returnQuotesAbove = 2;

    var count = Quotes.find().count();
    var lucky_index = Math.floor(Math.random() * (count));
    var lucky = Quotes.findOne({}, {skip:lucky_index});

    // keep grabbing a quote until a good one comes up.
    for (i = 0; i < 1000; i++ ) {
      var count = Quotes.find().count();
      var lucky_index = Math.floor(Math.random() * (count));
      var lucky = Quotes.findOne({}, {skip:lucky_index});

      if (lucky.upcount > returnQuotesAbove) break;
    }

    return lucky._id;
  },


  // This happens each time the user looks at a quotation
  viewQuote: function (quoteId) {

    check(quoteId, String);
    var activeQuote = Quotes.findOne({ _id: quoteId });

    // Just make sure we have a dogear attribute
    if (!Quotes.findOne({_id: quoteId, upcount: {$exists: true}})) {
      Quotes.update( { _id: quoteId }, {$set: { upcount: 0 }});
    }

    // Set views if not there
    if (!Quotes.findOne({_id: quoteId, views: {$exists: true}})) {
      Quotes.update( { _id: quoteId }, {$set: { views: 0 }});
    }


    // Update last time viewed attribute
    Quotes.update({ _id: quoteId }, { $set: { lastViewed: new Date() }});



    // Check if the user hasn't visited this question already
    if (Meteor.userId()) {

      // This checks the user doc to see if the quote _id is in the list
      // No longer using this as clogs up user doc
      // var user = Meteor.users.findOne({_id:this.userId, quotesVisited:{$ne:quoteId}});


      // Here we are trying to stop view refresh hacking
      // Please someone find a better way of doing this later, cheers
      if (activeQuote.lastViewedBy != this.userId) {

        Quotes.update( { _id: quoteId }, {$inc: { views: 1 }});

        // Don't clog up the user doc please
        // Meteor.users.update({_id:this.userId},{$addToSet:{ quotesVisited:quoteId}});
      }

      // Update last viewed by
      Quotes.update({ _id: quoteId }, { $set: { lastViewedBy: this.userId }});
    }
    else {
      if (activeQuote.lastViewedBy != clientIp) {
        console.log(clientIp + " accessed quote");
        Quotes.update({ _id: quoteId }, { $set: { lastViewedBy: clientIp }});
        Quotes.update( { _id: quoteId }, {$inc: { views: 1 }});
      }
    }
    return true;
  },

  // This passes an email address string and checks if it is in the Invites list
  isInvited: function (emailAddress) {
    check(emailAddress, String);
    return Invites.findOne({ email: emailAddress });
  },


  // Here we are going to check the size of the quote and then
  // set a value to it so that we can display long quotes with smaller font
  // etc etc
  checkQuoteSize: function(quoteSlug) {

    check(quoteSlug, String);

    var currentQuote = Quotes.findOne({ slug: quoteSlug });
    var quotation = currentQuote.quotation;

    //console.log(currentQuote.length);

    if (currentQuote.length == undefined) { // use currentQuote.length == undefined to only update undefined
      var n = quotation.length;

      // if (n > maximumQuotationLength) return false; // i don't like massive quotes and i cannot lie

      if (n <= 40) Quotes.update({ slug: quoteSlug }, { $set: { length: 'tiny' }});
      if (n > 40 && n <= 120) Quotes.update({ slug: quoteSlug }, { $set: { length: 'short' }});
      if (n > 120 && n <= 300) Quotes.update({ slug: quoteSlug }, { $set: { length: 'medium' }});
      if (n > 300 && n <= 500) Quotes.update({ slug: quoteSlug }, { $set: { length: 'long' }});
      if (n > 500) Quotes.update({ slug: quoteSlug }, { $set: { length: 'gigantic' }});
    }

    return true;
  },



  addInvite: function(inviteEmail) {
    if ( !Roles.userIsInRole( Meteor.userId(), 'admin') ) {
      throw new Meteor.Error("pants-not-found", "Can't find my pants");
    }

    const isInList = Invites.findOne({ email: inviteEmail });

    console.log(isInList);

    if (isInList) throw new Meteor.Error("Already invited", "Can't find my pants");

    inviteEmail = inviteEmail.toLowerCase();

    const invite = {$set: { email: inviteEmail}};
    console.log('Adding ' + inviteEmail + " to invite list.")
    Invites.upsert({email: inviteEmail}, invite);
  },


  addQuoteToPage: function (quotationText, authorText, sourceText, topicText, pageSlug) {
  // Make sure the user is logged in otherwise throw and error
  if (! Meteor.userId()) throw new Meteor.Error("not-authorized");

  // Please make this error actually do something
  // if (quotationText.length > maximumQuotationLength) throw new Meteor.Error('too-long');

  var n = 5;
  var shortenedText = quotationText.replace(/\s+/g," ").split(/(?=\s)/gi).slice(0, n).join('');
  shortenedText = shortenedText.replace(/[^a-zA-Z\d\s]/g, ""); // remove special chars as well

  var quoteSlug = slug(shortenedText);
  

  var newQuote = Quotes.insert({
    pageSlugs: [pageSlug],
    quotation: quotationText,
    author: authorText,
    source: sourceText,
    topic: topicText,
    authorSlug: slug(authorText),
    sourceSlug: slug(sourceText),
    topicSlug: slug(topicText),
    createdAt: new Date(), // current time
    username: Meteor.user().username, // username of whoever created quote
    createdBy: Meteor.userId(),  // _id of logged in user
    slug: quoteSlug,
  });


  // , function(error, result) {
  //   if (error) {
  //     console.log("Something went wrong trying to insert into the DB: " + error.message);
  //     throw new Meteor.Error("Already there");
  //     return result;
  //     }
  // }

  return quoteSlug; // Returns the _id of new quote
},
  



  deleteQuote: function(quoteId) {
    Quotes.remove(quoteId);
  },

  deleteAuthor: function(authorId) {
    Pages.remove(authorId);
  },

  

});