// These Meteor methods only run on the server. This is useful to hide things from the client.
// Things like database changes that the client might do latency compensation on are especially
// useful to hide from the client.

Meteor.methods({

	getRandomQuoteId: function() {
    var count = Quotes.find().count();
    var random_index = Math.floor(Math.random() * (count));
    var random_object = Quotes.findOne({}, {skip:random_index});
    console.log(random_object._id)
    return random_object._id;
  },


  // This happens each time the user looks at a quotation
  viewQuote: function (quoteId) {
    // Check if the user hasn't visited this question already
    if (Meteor.userId()) {
      var user = Meteor.users.findOne({_id:this.userId,quotesVisited:{$ne:quoteId}});
      console.log("user " + this.userId + " visited the quote " + quoteId );  


      if (!user) return false;
      

    // otherwise, increment the question view count and add the question to the user's visited page
      
      Quotes.update( { _id: quoteId }, {$inc: { views: 1 }});
      
      Meteor.users.update({_id:this.userId},{$addToSet:{quotesVisited:quoteId}});
      return true;
    } 
  },

  
  // This is a feature to "Like" a quotation. It should put the quote in the user's
  // likes list and then update the 
  collectQuote: function (quoteId) {
    if (Meteor.userId()) {
      var user = Meteor.users.findOne({_id:this.userId,liked:{$ne:quoteId}});
      

      if (!user) {
        Meteor.users.update({_id:this.userId},{$pull:{liked:quoteId}});
        Quotes.update( { _id: quoteId }, {$inc: { upcount: -1 } });

        return false;
      }

      
      console.log("user " + this.userId + " collected the quote " + quoteId );

      Quotes.update( { _id: quoteId }, {$inc: { upcount: 1 } });
      Meteor.users.update({_id:this.userId},{$addToSet:{liked:quoteId}});
      return true;
    }
  },

});