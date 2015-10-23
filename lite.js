// Super secret next step forward
Router.route('/', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('quotesAll');
  },
  action: function () {
    this.layout('LiteLayout');
    Session.set("DocumentTitle","Qurious");    

    // Here we send a quote to the front page if required
    Meteor.subscribe('quotesLatest', 1);

    this.render('Lite', {
      data: function () {
        return Quotes.findOne({});
      }      
    });
  }
});

Router.route('/q/:_quote_id', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('quotesSlug', this.params._quote_id);
  },
  action: function () {
    this.layout('LiteLayout');
    this.render('Lite', {
      data: function () {
        var quote = Quotes.findOne({ _id: this.params._quote_id });
        if (!quote) {
          quote = Quotes.findOne({ quote_id: this.params._quote_id });
        }
        if (!quote) {
          // this.render('NotFound');
          // had to comment out as this was flashing not found briefly due to the split second
          // it takes for the variable "quote" to be assigned..
        } 
        else {
          // Session.set('sessionQuoteId', this.params._quote_id);
          // Meteor.call('checkQuoteSize', this.params._quote_id); // small or big?

          // Let's try to get substring some text for the Title Bar
          // this regular expression is gold (i didn't write it btw)
          var titleText = quote.quotation.replace(/^(.{50}[^\s]*).*/, "$1");

          Session.set("DocumentTitle", titleText + " - Qurious");

          return quote;
        }
      }
    });
  },
});

Router.route('/r', function () {
  this.layout('LiteLayout');
  this.render('LiteLoad');
  Meteor.call('getRandomQuoteId', function (error, result) {
    var randomId = result;
    // replaceState keeps the browser from duplicating history
    Router.go('/q/' + randomId, {}, {replaceState:true});
  });
});

// Testing the Lite loader
Router.route('/load', function() {
  this.layout('LiteLayout');
  Session.set("DocumentTitle","Loading - Qurious");
  this.render('LiteLoad');
});