Meteor.methods({

	getRandomQuoteId: function() {
    var count = Quotes.find().count();
    var random_index = Math.floor(Math.random() * (count));
    var random_object = Quotes.findOne({}, {skip:random_index});
    console.log(random_object._id)
    return random_object._id;
  },

});