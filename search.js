if (Meteor.isClient) { // only runs on the client

  var options = {
    keepHistory: 1000 * 60 * 5,
    localSearch: true
  };
  var fields = ['quotation', 'attribution'];

  QuoteSearch = new SearchSource('quotes', fields, options);



  Template.Search.helpers({
    getQuotes: function() {
      return QuoteSearch.getData({
        transform: function(matchText, regExp) {
          return matchText.replace(regExp, "<b>$&</b>")
        },
        sort: {createdAt: -1}
      });
    },
    
    isLoading: function() {
      return QuoteSearch.getStatus().loading;
    },


  });


  Template.Search.events({
    "keyup #search-box": _.throttle(function(e) {
      var text = $(e.target).val().trim();
      QuoteSearch.search(text);
    }, 200)
  });

}


if (Meteor.isServer) {
  SearchSource.defineSource('quotes', function(searchText, options) {
    var options = {sort: {createdAt: -1}, limit: 20};
    
    if(searchText) {
      var regExp = buildRegExp(searchText);
      var selector = {$or: [
        {quotation: regExp},
        {attribution: regExp}
      ]};
      
      return Quotes.find(selector, options).fetch();
    } else {
      return Quotes.find({}, options).fetch();
    }
  });

  function buildRegExp(searchText) {
    // this is a dumb implementation
    var parts = searchText.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
  }
}

