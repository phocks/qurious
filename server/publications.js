// Get the server to publish our collections
// Basically we only want to publish the quotes from our server which we are
// actually interested in using on the client side.
// These have become so messy. Think about cleaning up.
Meteor.publish("quotesAll", function () {
  return Quotes.find({}, { sort: {createdAt: -1} });
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




Meteor.publish("quotesCurrentUser", function () {
  return Quotes.find({ owner: this.userId });
});




Meteor.publish("quotesSlugUser", function (user_slug) {
  check(user_slug, String);
  return Quotes.find({ username: user_slug }, { sort: {createdAt: -1}});
});




Meteor.publish("quotesSlug", function (slug) {
  check(slug, String);
  var quote = Quotes.find({ _id: slug });
  // console.log(quote); // trying to get counter quotes working too../....
  // if (!quote) quote = Quotes.find({ quote_id: slug });
  return quote;
});




// Pusblish quotes given IDs in an array as input
Meteor.publish("quotesInArray", function (array) {
  return Quotes.find({ _id: { $in: array } }); // , {sort: {createdAt: -1}} taken out as test
});




Meteor.publish("counters", function () {
  return Counters.find();
});




// We are going to publish some more userData
// in order to check if user is admin we need this
Meteor.publish("userData", function () {
  return Meteor.users.find({},
    { fields: {'admin':1, 'liked': 1, 'username': 1 }
  });


  /*if (this.userId) {
    return Meteor.users.find({_id: this.userId},
      { fields: {'admin': 1, 'liked': 1, 'username': 1 }
    });
  } else {
    return Meteor.users.find({},
      { fields: {'liked': 1, 'username': 1 }
    });
    this.ready();
  }*/
});