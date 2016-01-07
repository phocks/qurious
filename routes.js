// This file handles all the URL routes. It uses the iron:router Meteor package.



// Let's test out an API call for use in the future
Router.route('/api', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});






/* The root home route landing for qurious.cc/   */

Router.route('/', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    return Meteor.subscribe("words");
  },
  action: function () {
    this.layout('LiteLayout');
    Session.set("DocumentTitle","Qurious");
    // this.render('LiteHeader', { to: 'header'});

    // Here we send a quote to the front page if required
    Meteor.subscribe('quotesLatest', 1);

    this.render('LiteHome', {
      data: { 
        words: function () {
          return Words.find({});
          }
        }  
    });
    this.render('LiteFooter', { to: 'footer'});
    this.render('LiteNav', { to: 'nav'});
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
    this.layout('LiteLayout');
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
    this.render('LiteNav', { to: 'nav'});
  },
});




// gets a random quote and redirects to the page
Router.route('/random', function () {
  Session.set('currentWord', undefined);
  Meteor.call('getRandomQuoteId', function (error, result) {
    var randomId = result;
    // replaceState keeps the browser from duplicating history
    Router.go('/quote/' + randomId, {}, {replaceState:true});
  });
  this.render('LiteLoad');
});



// Random with word search specified
Router.route('/random/:_word', function () {
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
    this.layout('LiteLayout');
    Session.set("DocumentTitle","Qurious");
    this.render('Menu');
    this.render('LiteNav', { to: 'nav'});
  }
});

Router.route('/about', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    
  },
  action: function () {
    this.layout('LiteLayout');
    Session.set("DocumentTitle","About Qurious");
    this.render('About');
    this.render('LiteNav', { to: 'nav'});
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
    this.layout('LiteLayout');
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


    Router.go('/random/' + wordText, {}, {replaceState:true});



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
    this.render('LiteNav', { to: 'nav'});


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
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    Meteor.subscribe("words");
    return Meteor.subscribe("quotes");
  },
  action: function () {
    this.layout('LiteLayout');
    

    console.log("current user is: " + Meteor.userId());

    // for now only phocks can do this
    // if (Meteor.userId() !== "jNX4BenrzyEgsMqTY") Router.go('/');


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
    this.render('LiteFooter', { to: 'footer'});
    this.render('LiteNav', { to: 'nav'});
  },
});







// Quick and easy logouts
Router.route('/logout', function() {
  AccountsTemplates.logout();
  Router.go('/');
});








// Testing the Lite loader
Router.route('/load', function() {
  this.layout('LiteLayout');
  Session.set("DocumentTitle","Loading - Qurious");
  this.render('LiteLoad');
});








// This is our catch all for all other unknown things
// Probably won't be called all that much
// Especially after we implement qurious.cc/phocks user pages
Router.route('/(.*)', function() {
  this.layout('LiteLayout');
  Session.set("DocumentTitle","404 Qurious");
  this.render('LiteError');
});



// DONT PUT ROUTES BELOW HERE BECAUSE THEY WON'T WORK














// First some static pages with About Us and Privacy etc.


// Router.route('/about', function() {
//   if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//   this.layout('ApplicationLayout');
//   Session.set("DocumentTitle", "Qurious About Us?");
//   this.render('Header', {to: 'header'});
//   this.render('AboutText');
//   this.render('Footer', {to: 'footer'});
// });

// Router.route('/privacy', function() {
//   if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//   this.layout('ApplicationLayout');
//   Session.set("DocumentTitle", "Privacy Policy - Qurious");
//   this.render('Header', {to: 'header'});
//   this.render('PrivacyText');
//   this.render('Footer', {to: 'footer'});
// });

// Router.route('/terms', function() {
//   if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//   this.layout('ApplicationLayout');
//   Session.set("DocumentTitle", "Terms & Conditions - Qurious");
//   this.render('Header', {to: 'header'});
//   this.render('TermsText');
//   this.render('Footer', {to: 'footer'});
// });

// Router.route('/contact', function() {
//   if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//   this.layout('ApplicationLayout');
//   Session.set("DocumentTitle", "Contacting Qurious");
//   this.render('Header', {to: 'header'});
//   this.render('ContactText');
//   this.render('Footer', {to: 'footer'});
// });



// // This route is for useraccounts
// AccountsTemplates.configureRoute('signIn', {
//     name: 'signin',
//     path: '/login',
//     template: 'Login',
//     redirect: '/random',
//     yieldTemplates: {
//         Header: {to: 'header'},
//         Footer: {to: 'footer'},
//     }
// });





// // Now here are the main routes












// // Quotes sorted by popularity, dogears etc.
// Router.route('/explore', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {

//   },

//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle", "Popular Quotes - Qurious");
//     this.render('Header', {to: 'header'});
//     this.render('Quotes', {
//       data: {
//         quotes: function () {
//           return Quotes.find({}, {sort: {views: -1, upcount: -1}, limit: Session.get('limit') });
//         }
//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });




// // Quotes sorted by popularity, dogears etc.
// Router.route('/explore/popular', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {

//   },

//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle", "Popular Quotes - Qurious");
//     this.render('Header', {to: 'header'});
//     this.render('Quotes', {
//       data: {
//         quotes: function () {
//           return Quotes.find({}, {sort: {views: -1, upcount: -1}, limit: Session.get('limit') });
//         }
//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });




// Router.route('/explore/latest', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {

//   },

//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle", "Latest Quotes - Qurious");

//     this.render('Header', {to: 'header'});
//     this.render('Quotes', {
//       data: {
//         quotes: function () {
//           return Quotes.find( { }, {sort: {createdAt: -1}, limit: Session.get('limit') });
//         }
//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });



// // Here is a nice little route that gives a single quote
// // given a specified _id in the quotes collection as URL param
// Router.route('/quotes/:_quote_slug', {
//   loadingTemplate: 'Loading',
//   waitOn: function () {
//     // return one handle, a function, or an array
//     return Meteor.subscribe('quotesSlug', this.params._quote_slug);
//   },
//     onBeforeAction: function() {

//       this.next(); // does this do anything? i don't think so
//   },
//     onAfterAction: function() {
//       // if (Meteor.userId()) currentUserId = Meteor.userId();
//       // Meteor.users.update({_id:currentUserId},{$addToSet:{quotesVisited:this.params._quote_slug}});
//     },
//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     this.render('Header', {to: 'header'});
//     this.render('SingleQuote', {
//       data: function () {
//           var quote = Quotes.findOne({ _id: this.params._quote_slug });
//           if (!quote) {
//             this.render('NotFound');
//           } else {
//             Session.set('sessionQuoteId', this.params._quote_slug);
//             Meteor.call('checkQuoteSize', this.params._quote_slug); // small or big?

//             // Let's try to get substring some text for the Title Bar
//             // this regular expression is gold (i didn't write it btw)
//             var titleText = quote.quotation.replace(/^(.{50}[^\s]*).*/, "$1");

//             Session.set("DocumentTitle", titleText + " - Qurious");

//             return quote;
//           }
//         }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });

// // Identical route but handles extra text for SEO (but disregarded)
// // Please keep up to date with previous or figure out how to replicate automatically
// Router.route('/quotes/:_quote_slug/:_extra_text', {
//   /* blah blah blah  probably better look for a wilcard thing */
// });





// Router.route('/random', {
//   onBeforeAction: function () {
//     Meteor.call('getRandomQuoteId', function (error, result) {
//       var randomId = result;
//       // replaceState keeps the browser from duplicating history
//       Router.go('/quotes/' + randomId, {}, {replaceState:true});
//     });

//     this.next()
//   },
//   action: function () {
//     this.render('Header', {to: 'header'});

//   },
// });


// Router.route('/lucky', {
//   onBeforeAction: function () {
//     Meteor.call('getLuckyQuoteId', function (error, result) {
//       var luckyId = result;
//       // replaceState keeps the browser from duplicating history
//       Router.go('/quotes/' + luckyId, {}, {replaceState:true});
//     });

//     this.next()
//   },
//   action: function () {
//     this.render('Header', {to: 'header'});

//   },
// });





// Router.route('/users/:_username', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {


//   },

//   action: function () {
//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle","Exploring " + this.params._username + " - Qurious");


//     var username_to_lookup = this.params._username; //to pass it into the function

//     this.render('Header', {to: 'header'});
//     this.render('Quotes', {
//       data: {
//         quotes: function () {
//           return Quotes.find({ username: username_to_lookup }, {sort: {createdAt: -1}, limit: Session.get('limit') });
//         },
//         usernameToShow: function () { return username_to_lookup },
//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });








// Router.route('/users/:_username/dogears', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {
//     // This apparently we need for asyc stuff or something
//     return Meteor.subscribe("userData");
//   },

//   onBeforeAction: function () {
//     Session.set("DocumentTitle", this.params._username + " Dogears - Qurious");
//     this.next();
//   },

//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in
    
//     this.layout('ApplicationLayout');
//     this.render('Header', {to: 'header'});
//     //to pass it into the function, someone help with this
//     var usernameParam = this.params._username;
//     var user = Meteor.users.findOne( { username: this.params._username } );

//     console.log(user.liked);

//     Meteor.subscribe('quotesInArray', user.liked);


//     this.render('Quotes', {
//       data: {
//         quotes: function () {
//           return Quotes.find({ _id: { $in: user.liked } },
//             { limit: Session.get('limit') }); //sort: { createdAt: -1 },
//         },
//         usernameToShow: function () { return usernameParam },

//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });



// // What we want to do here is search
// Router.route('/search/:_terms', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {


//   },

//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle","Quotes with: " + this.params._terms + " - Qurious");


//     var terms_to_lookup = this.params._terms; // someone explain why we need to do this please

//     this.render('Header', {to: 'header'});
//     this.render('Quotes', {
//       data: {
//         quotes: function () {
//           return Quotes.find({ $or: [ { quotation: { '$regex': terms_to_lookup, $options: 'i'} },
//             { attribution: { '$regex': terms_to_lookup, $options: 'i'}} ] },
//             {sort: {views: -1}, limit: Session.get('limit') });
//         },
//         exploreToShow: function () { return terms_to_lookup },
//       }
//     });
//     this.render('Footer', {to: 'footer'});
//   }
// });



// // The front landing page
// Router.route('/home', {
//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle","Qurious");
//     this.render('Header', {
//       to: 'header',
//       data: {
//         frontPage: true // This boolean data is sent to the Header
//       }
//     });

//     // Here we send a quote to the front page if required
//     Meteor.subscribe('quotesPopular', 1);

//     this.render('Home', {
//       data: function () {
//         return Quotes.findOne({});
//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });


// // Just to test the loader
// Router.route('/loading', function() {
//   if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//   this.layout('ApplicationLayout');
//   Session.set("DocumentTitle","Loading - Qurious");

//   this.render('Loading');
// });



// Router.route('/all_quotes', {
//   loadingTemplate: 'LiteLoad',
//   waitOn: function () {
//     // return one handle, a function, or an array
//     return Meteor.subscribe("quotesAll");
//   },
//   action: function () {
//     this.layout('LiteLayout');
//     // this.render('LiteHeader', { to: 'header'});
//     this.render('AdminAllQuotes', {
//       data: {
//         quotes: function () {  
//           Session.set("DocumentTitle", "All Quotes");

//           return Quotes.find({}, { sort: { quotation: 1 }});
//           }
//         }
//       });
//     this.render('LiteFooter', { to: 'footer'});
//     this.render('LiteNav', { to: 'nav'});
//   },
// });



// // Adding and submitting a new quote
// Router.route('/create', {
//   loadingTemplate: 'Loading',

//   waitOn: function () {
//     // return one handle, a function, or an array
//     return Meteor.subscribe('userData');
//   },

//   action: function () {
//     if ( ! Meteor.user() ) Router.go('/'); // deny not logged in

//     this.layout('ApplicationLayout');
//     Session.set("DocumentTitle", "Create a Quote - Qurious");
//     this.render('Header', {to: 'header'});
//     this.render('Create', {
//       data: {
//         isAdmin: function() {
//           if (Meteor.user().admin) return true;
//           else return false;
//         }
//       }
//     });

//     this.render('Footer', {to: 'footer'});
//   }
// });



// Router.route('/add/:_word_to_add', {
//   loadingTemplate: 'LiteLoad',
//   waitOn: function () {
    
//   },
//   action: function () {
//     this.layout('LiteLayout');
//     // this.render('LiteHeader', { to: 'header'});
//     this.render('WordProcess', {
//       data: function () {
//         var word = Words.findOne({word: this.params._word_text});
        
//         return word;
//       }
//     });
//     this.render('LiteFooter', { to: 'footer'});
//     this.render('LiteNav', { to: 'nav'});
//   },
//   onAfterAction: function () {
    
//   }
// });



// Router.route('/authors', {
//   loadingTemplate: 'LiteLoad',
//   waitOn: function () {
    
//   },
//   action: function () {
//     this.layout('LiteLayout');
//     this.render('ListAuthors');
//     this.render('LiteNav', { to: 'nav'});
//   }
// });


// Router.route('/a/:_slug', {
//   loadingTemplate: 'LiteLoad',
//   waitOn: function () {
    
//   },
//   action: function () {
//     this.layout('LiteLayout');
//     this.render('LiteNav', { to: 'nav'});
//   }
// });




// Router.route('/words', {
//   loadingTemplate: 'LiteLoad',
//   waitOn: function () {
//     // return one handle, a function, or an array
//     return Meteor.subscribe("words");
//   },
//   action: function () {
//     this.layout('LiteLayout');
//     // this.render('LiteHeader', { to: 'header'});
//     this.render('AllWords', {
//       data: {
//         words: function () {  
//           Session.set("DocumentTitle", "All Words");

//           return Words.find({});
//           }
//         }
//       });
//     this.render('LiteFooter', { to: 'footer'});
//     this.render('LiteNav', { to: 'nav'});
//   },
// });





// Router.route('/a/:_author_slug', {
//   loadingTemplate: 'LiteLoad',
//   waitOn: function () {
    
//   },
//   action: function () {
//     this.layout('LiteLayout');
//     // this.render('LiteHeader', { to: 'header'});
//     this.render('LiteAuthor');
//     // this.render('LiteFooter', { to: 'footer'});
//     this.render('LiteNav', { to: 'nav'});
//   },
// });
