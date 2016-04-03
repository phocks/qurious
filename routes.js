// This file handles all the URL routes. It uses the iron:router Meteor package.



// Let's test out an API call for use in the future
Router.route('/api', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});



/* The root home route landing for qurious.cc/   */
Router.route('/', {
  action: function () {
    Session.set("DocumentTitle","Qurious");      
    this.render('Home', { });
    this.render('Nav', { to: 'nav'});
  }
});



// A page where you can click to see more
Router.route('/explore', {
  waitOn: function () {    
    Meteor.subscribe('authors');
  },
  action: function () {
    Session.set("DocumentTitle","Qurious");
    this.render('Explore', {
      data: { 
        authors: function () {
          return Authors.find({});
          }
        }
    });
    this.render('Nav', { to: 'nav'});
  }
});









// Takes the doc _id and displays quote
Router.route('/quote/:_quote_id', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('quotesSlug', this.params._quote_id);
  },
  action: function () {
    this.layout('Layout');
    // this.render('LiteHeader', { to: 'header'});

    console.log("Current word in session: " + Session.get('currentWord'));

    

    this.render('LiteQuote', {
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
          Session.set('sessionQuoteId', this.params._quote_id);
          // Meteor.call('checkQuoteSize', this.params._quote_id); // small or big?

          // Let's try to get substring some text for the Title Bar
          // this regular expression is gold (i didn't write it btw)
          var titleText = quote.quotation.replace(/^(.{50}[^\s]*).*/, "$1");

          Session.set("DocumentTitle", quote.attribution + " · " + titleText + " - Qurious");


          return quote;
        }
      }
    });
    this.render('LiteFooter', { to: 'footer'});
    this.render('Nav', { to: 'nav'});
  },
});





// Takes the doc _id and displays quote with edit functions
Router.route('/quote/:_quote_id/edit', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('quotesSlug', this.params._quote_id);
  },
  action: function () {
    this.layout('Layout');
    // this.render('LiteHeader', { to: 'header'});

    console.log("Current word in session: " + Session.get('currentWord'));

    this.render('LiteQuoteEdit', {
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
          Session.set('sessionQuoteId', this.params._quote_id);
          // Meteor.call('checkQuoteSize', this.params._quote_id); // small or big?

          // Let's try to get substring some text for the Title Bar
          // this regular expression is gold (i didn't write it btw)
          var titleText = quote.quotation.replace(/^(.{50}[^\s]*).*/, "$1");

          Session.set("DocumentTitle", quote.attribution + " · " + titleText + " - Qurious");


          return quote;
        }
      }
    });
    this.render('LiteFooter', { to: 'footer'});
    this.render('Nav', { to: 'nav'});
  },
});





// gets a random quote and redirects to the page
Router.route('/flip', function () {
  Session.set('currentWord', undefined);
  Meteor.call('getRandomQuoteId', function (error, result) {
    var randomId = result;
    // replaceState keeps the browser from duplicating history
    Router.go('/quote/' + randomId, {}, {replaceState:true});
  });
  this.render('LiteLoad');
});



// Random with word search specified
Router.route('/flip/:_word', function () {
  Meteor.call('getRandomQuoteIdWithStringAllFields', this.params._word, function (error, result) {
    var randomId = result;


    if (!randomId) {
      Router.go('/notfound', {}, {replaceState:true});
      return false;
    }
    // replaceState keeps the browser from duplicating history, needs the {} as 2nd arg

    Router.go('/quote/' + randomId, {}, {replaceState:true});
  });

  this.render('LiteLoad');
});










Router.route('/menu', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    
  },
  action: function () {
    this.layout('Layout');
    Session.set("DocumentTitle","Qurious");
    this.render('Menu');
    this.render('Nav', { to: 'nav'});
  }
});








Router.route('/about', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    
  },
  action: function () {
    this.layout('Layout');
    Session.set("DocumentTitle","About Qurious");
    this.render('BeliefAbout');
    this.render('Nav', { to: 'nav'});
  }
});










Router.route('/word/:_word_text', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    // only return at the end
    // Meteor.subscribe('Quotes');
    return Meteor.subscribe("words");
  },
  action: function () {
    this.layout('Layout');
    // this.render('LiteHeader', { to: 'header'});

    var wordText = this.params._word_text; // this has to be a var for some reason to work

    // console.log(s.slugify("Hello world!")); // just a test

    var word = Words.findOne({word: wordText});
    
    // if (word == undefined) { // does the word exist in the database?
    //   Router.go('/word/' + wordText + "/add", {}, {replaceState:true});
    //   return false; // get me out of here
    // }

    Session.set('currentWord', wordText);
    console.log("Setting session word: " + wordText);


    Router.go('/flip/' + wordText, {}, {replaceState:true});



    this.render('WordProcess', {

      data: {
        word: function () {
          return wordText;
        },
        // quotes: function () {
        //   return Quotes.find({ quotation: { '$regex': wordText, $options: 'i'} });
        // }
      }
    });
    this.render('LiteFooter', { to: 'footer'});
    this.render('Nav', { to: 'nav'});


    // Due to multiply:iron-router-progress calling actions twice we need this
    // if (Tracker.currentComputation.firstRun) {

    //   var timeout = getRandomInt(500,2000);

    //   console.log("Sleeping for " + timeout + "ms");      
    
      
    //   Meteor.setTimeout(function(){

    //     // Move to a new location or you can do something else
    //     // window.location.href = "/random/" + wordText;

    //     Router.go("/random/" + wordText);

    //   }, timeout);
    // }
    
  }
});




Router.route('/admin', {
  waitOn: function () {
    Meteor.subscribe("words");
    Meteor.subscribe("userData")
    return Meteor.subscribe("quotes");
  },
  action: function () {
    
    // Only logged in users
    if (Meteor.user()) {  

      // Test for adminPermissions
      if (!Meteor.user().isAdmin) Router.go('/');

    } else { Router.go('/login'); }



    this.render('AdminStation', {
      data: { 
        words: function () {
          return Words.find({});
          },
        quotes: function () {
          return Quotes.find({});
          }
        }
      });
    // this.render('LiteFooter', { to: 'footer'});
    this.render('Nav', { to: 'nav'});
  },
});





Router.route('/login', {
  waitOn: function () {
    
  },
  action: function () {
    if (Meteor.user() ) Router.go('/'); // deny not logged in
    this.layout('Layout');
    Session.set("DocumentTitle","Qurious Login");
    this.render('Login');
    this.render('Nav', { to: 'nav'});
  }
});




// Quick and easy logouts
Router.route('/logout', function() {
  AccountsTemplates.logout();
  Router.go('/');
});



Router.route('/:_slug/add', {
  waitOn: function () {    
    return Meteor.subscribe('authors');
  },
  action: function () {
    var slug = this.params._slug;
    currentAuthor = Authors.findOne({slug: slug});
    Session.set("DocumentTitle", "Add a " + currentAuthor.name + " quotation - Qurious");
    this.render('AddQuote');
    this.render('Nav', { to: 'nav'});
  }
});




// An exploration into the unknown
Router.route('/:_slug', {
  waitOn: function () {    
    return Meteor.subscribe('authors');
  },
  action: function () {
    var slug = this.params._slug;
    currentAuthor = Authors.findOne({slug: slug});
    Session.set("DocumentTitle", currentAuthor.name + " - Qurious");
    this.render('Author', {
      data: { 
        author: function () {
          return Authors.findOne({slug: slug});
          }
        }
    });
    this.render('Nav', { to: 'nav'});
  }
});





// This is our catch all for all other unknown things
// Probably won't be called all that much
// Especially after we implement qurious.cc/phocks user pages
Router.route('/(.*)', function() {
  this.layout('Layout');
  Session.set("DocumentTitle","Qurious - 404 not found");
  this.render('LiteError');
});



// Please refrain from putting any routes below here as they will (probably) not work



// Testing the Lite loader
// Router.route('/load', function() {
//   this.layout('Layout');
//   Session.set("DocumentTitle","Loading - Qurious");
//   this.render('Loading');
// });
