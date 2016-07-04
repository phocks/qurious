// Get the server to publish our collections
// Basically we only want to publish the quotes from our server which we are
// actually interested in using on the client side.
// These have become so messy. Think about cleaning up.
Meteor.publish("quotes", function () {
  return Quotes.find({});
});




Meteor.publish("quotesLatest", function (limit) {
  if (limit > Quotes.find().count()) {
    limit = 0;
  }
  return Quotes.find({}, { sort: {createdAt: -1}, limit: limit });
});




Meteor.publish("quotesPopular", function (limit) {
  if (limit > Quotes.find().count()) {
    limit = 0;
  }

  return Quotes.find({}, { sort: {views: -1, upcount: -1}, limit: limit });
});




// Meteor.publish("quotesCurrentUser", function () {
//   return Quotes.find({ owner: this.userId });
// });




Meteor.publish("quotesSlugUser", function (user_slug) {
  check(user_slug, String);
  return Quotes.find({ username: user_slug }, { sort: {createdAt: -1}});
});




Meteor.publish("quotesSlug", function (slug) {
  check(slug, String);
  var quote = Quotes.find({ slug: slug });
  // console.log(quote); // trying to get counter quotes working too../....
  // if (!quote) quote = Quotes.find({ quote_id: slug });

  

  // Simulated latency (doesn't do anything if doc already in miniMongo memory)
  // var timeToSleep = getRandomInt(300,1000);
  // console.log("Simulating latency for " + timeToSleep + " milliseconds.");
  // Meteor._sleepForMs(timeToSleep); 

  return quote;
});




Meteor.publish("quotesAuthorId", function (authorId) {
  return Quotes.find({ authorId: authorId });
});




// Pusblish quotes given IDs in an array as input
Meteor.publish("quotesInArray", function (array) {
  return Quotes.find({ _id: { $in: array } }); // , {sort: {createdAt: -1}} taken out as test
});




// Meteor.publish("counters", function () {
//   return Counters.find();
// });







Meteor.publish("invites", function (emailAddress) {
  return Invites.find({ email: emailAddress });
})




// Meteor.publish("words", function () {
//   return Words.find();
// });

Meteor.publish("pagesPending", function () {
  return Pages.find({  });
});

// Return all pages this is bad do something different
Meteor.publish("pagesVerified", function () {
  return Pages.find({ verified: true });
});

Meteor.publish("pagesAll", function () {
  return Pages.find({ verified: false });
});



// Meteor.publish("profiles", function () {
//   return Profiles.find({});
// })


// Let's return a page when supplied a page slug
Meteor.publish("pagesWithPageSlug", function (pageSlug) {
  return Pages.find({ slug: pageSlug });
});