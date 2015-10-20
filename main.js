// ___  ___
// |  \/  |
// | .  . | ___  __ _  __ _ _ __ ___
// | |\/| |/ _ \/ _` |/ _` | '__/ _ \
// | |  | |  __/ (_| | (_| | | |  __/
// \_|  |_/\___|\__,_|\__, |_|  \___|
//                     __/ |
//                    |___/
//
// Qurious, a web app for creating and sharing quotes
// Copyright Meagre 2015- All rights reserved

/* This file originally created by Joshua Byrd for Meagre. */



// First up we are going to create a few collections
Quotes = new Mongo.Collection('quotes');  // Our main quote db
Counters = new Mongo.Collection('counters'); // Handles numbering (which we no longer use)




// Initial setup of some things below
// like some variables etc

loadMoreLimit = 5;  // for infinite scrolling, how many per load
maximumQuotationLength = 1000; // in characters




// Here we have stuff that will only run on the client's browser

if (Meteor.isClient) { // only runs on the client



  // We need to tell the client to subscribe explicitly to data collections
  // Later we don't want to subscribe to the whole thing
  // moved to individual routes // Meteor.subscribe("quotes");
  Meteor.subscribe("counters");
  Meteor.subscribe("userData"); // for admin access etc.




  // Font experiment to see if we can load fonts on demand
  // and YES it looks like we can.
  if (false) {  // for now let's just disable this, but bring it back later
    WebFontConfig = {
      google: { families: [ 'Vollkorn::latin' ] }
    };
    (function() {
      var wf = document.createElement('script');
      wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
      wf.type = 'text/javascript';
      wf.async = 'true';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(wf, s);
    })();
  }



  // I'm going to set up some things to be tracked automatically

  Tracker.autorun(function () {
    var quoteId = Session.get("sessionQuoteId");

    if (quoteId != undefined) {
      Meteor.call('viewQuote', quoteId, function(e,r) {
        if (r)
          console.log("Quote " + quoteId + " was viewed.");
        else
          console.log("Quote " + quoteId + " is doing something wrong "
            + Meteor.userId());
      });
    }
  });



  // Here we work out what kind of signups we want to use
  // One of 'USERNAME_AND_EMAIL', 'USERNAME_AND_OPTIONAL_EMAIL',
  // 'USERNAME_ONLY', or 'EMAIL_ONLY' (default).
  // Note: this doesn't do anything when using useraccounts:core
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
  });


  // Some more configs to run initially

  Router.configure({
    layoutTemplate: 'ApplicationLayout',
    loadingTemplate: "Loading",
    yieldTemplates: {
        Header: {to: 'header'},
        Footer: {to: 'footer'},
    },
    //notFoundTemplate: '404' //this is used for somewhat custom 404s
  });


  Router.plugin('dataNotFound', {notFoundTemplate: 'NotFound'});


  // We have a package that gets us to the top when we navigate
  // This changes the animation period, set to zero for none
  // Doesn't seem to work with mobile (or sometimes at all)
  RouterAutoscroll.animationDuration = 200;


  // Call this at any time to set the <title>
  Session.set("DocumentTitle","Qurious - Curiously Quotable");

  // Sets up automatically setting <title> in head
  // Simply do Session.set("DocumentTitle", "Whatever you want"); 
  Tracker.autorun(function(){
    document.title = Session.get("DocumentTitle");
  });



  // Setting up the useraccounts:core
  AccountsTemplates.configure({
    forbidClientAccountCreation: false,
    enablePasswordChange: true,
    showForgotPasswordLink: true,
    lowercaseUsername: true,

    homeRoutePath: '/',
    redirectTimeout: 4000,

    defaultLayout: 'ApplicationLayout',

    texts: { // Here we enter some custom error messages
        errors: {
            accountsCreationDisabled: "Client side accounts creation is disabled!!!",
            cannotRemoveService: "Cannot remove the only active service!",
            captchaVerification: "Captcha verification failed!",
            loginForbidden: "error.accounts.User or password incorrect",
            mustBeLoggedIn: "error.accounts.Must be logged in",
            pwdMismatch: "error.pwdsDontMatch",
            validationErrors: "Validation Errors",
            verifyEmailFirst: "Please verify your email first. Check the email and follow the link!",
        }
    },
  });


  // We are making a field that accepts username + email
  // This is so that a user can log in with either
  var pwd = AccountsTemplates.removeField('password');
  AccountsTemplates.removeField('email');
  AccountsTemplates.addFields([
    {
        _id: "username",
        type: "text",
        displayName: "username",
        required: true,
        minLength: 3,
    },
    {
        _id: 'email',
        type: 'email',
        required: true,
        displayName: "email",
        re: /.+@(.+){2,}\.(.+){2,}/,
        errStr: 'Invalid email',
    },
    pwd
  ]);




  // We are setting up Infinite Scrolling here
  // This is not a very elegant way of doing it. Please change in future


  incrementLimit = function(inc) { // this is defining a new global function
    var inc = loadMoreLimit;
    newLimit = Session.get('limit') + inc;
    Session.set('limit', newLimit);
  }

  Template.Quotes.created = function() {
    Session.set('limit', loadMoreLimit);  // use Session.setDefault maybe

    // Deps.autorun() automatically rerun the subscription whenever Session.get('limit') changes
    // http://docs.meteor.com/#deps_autorun
    // Changed to 'Tracker' in newer versions of Meteor
    Tracker.autorun(function() {
      Meteor.subscribe('quotesPopular', Session.get('limit'));
      Meteor.subscribe('quotesLatest', Session.get('limit'));
      Meteor.subscribe('quotesCurrentUser', Session.get('limit'));
    });
  }

  // This is an auto load feature when we have reached the bottom
  /*
  Template.Quotes.rendered = function() {
    // is triggered every time we scroll
    $(window).scroll(function() {
      if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
        incrementLimit();
      }
    });
  }
  */

  // Enable the "Load more" button
  Template.Quotes.events({
    'click .give-me-more': function(evt) {
      incrementLimit();
    }
  });





  // Here are the helpers to put data into Templates etc

  Template.SingleQuote.helpers({
    // determines if user submitted quote
    isOwner: function () {
      var quoteId = Session.get("sessionQuoteId");
      var currentQuote = Quotes.findOne({ _id: quoteId });

      if (currentQuote.owner == Meteor.userId()) {
        console.log("The current user has submitted this quote.")
        return true;
      }
      else return false;
    },
    // works out if user has dogeared quote or not
    dogeared: function () {
      if (!Meteor.user()) return false; // if not logged in just undogear
      var quoteId = Session.get("sessionQuoteId");
      var user = Meteor.users.findOne({_id:Meteor.userId(), liked:{ $ne:quoteId }});
      if (user) return false;
      else return true;
    }
  });



  // And some global helpers etc

  // This sets the time format using the moment package
  Template.registerHelper('formatTime', function(context, options) {
    if(context)
      return moment(context).format('DD/MM/YYYY, hh:mm a');
  });

  // Gives us a {{username}} variable to use in html
  Template.registerHelper('currentUsername', function () {
      return Meteor.user().username;
    }
  );




// Events that drive things like clicks etc

  // Let's finally set up a delete
  Template.SingleQuote.events({
    "click .delete-click": function () {
      if (confirm('Really delete ?')) {
        Meteor.call('deleteQuote', this._id);
      }
    },

    // Put the quotation into the users collection!
    "click .dogear-click": function () {
      console.log("Calling function to dogear this quote");
      Meteor.call('dogearQuote', this._id);
    },

    // Remove the quotation into the users collection!
  });


  // this isn't even used any more but yeah it's for a delete button on Explore
  Template.Quotes.events({
    "click .delete-click": function () {
      Meteor.call('deleteQuote', this._id);
    },


    /*"click .list-quote": function () {
      Router.go('/quotes/' + this._id);
    } this was commented out in favour of a direct read more link */
  });




    Template.Create.events({
    "submit .new-quote": function (event) {
      var text = event.target.text.value;
      var attribution = event.target.attribution.value;
      if (text == "" || attribution == "") return false; // prevent empty strings

      Meteor.call('addQuote', text, attribution, function(error, result) {
        var newQuoteId = result;
        Router.go('/quotes/' + newQuoteId);
      });

      // Clear form
      event.target.text.value = "";
      event.target.attribution.value = "";


      // Prevent default action from form submit
      return false;
    },
    "click .delete": function () {
      Meteor.call('deleteQuote', this._id);
    }
  });



    Template.Header.events({
    "submit .search-form": function (event) {
      var q = event.target.q.value;

      if (q == "") {
        Router.go('/explore/latest');
        return false; 

      }

      //event.target.q.value = "";


      Router.go('/search/' + q);


      // Prevent default action from form submit
      return false;
    },

    // I was trying to create a delete x here but it was too hard
    // so I quit doing it
    // "click .searchclear": function (event, template) {
    //   $('.search-form')[0].reset();
    // }

    // This will enable instant search if we want it
    // "keyup .form-control": function (event) {
    //   var q = event.target.value;

    //   console.log("key pressed in header search");

    //   // if (q == "") {
    //   //   Router.go('/explore/latest');
    //   //   return false; 

    //   // }

    //   //event.target.q.value = "";


    //   Router.go('/search/' + q);


    //   // Prevent default action from form submit
    //   return false;
    // },
    
  });



  // trying out this router hook thing to reset the post limit
  Router.onBeforeAction(function() {
    Session.set('limit', loadMoreLimit); // set the infinite scroll limit back to default
    //$(window).scrollTop(0); // this replaces the auto scroll package

    this.next();
  });



} // this marks the end of the client code





// ---------------- Code for the server only goes below
if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    // init the counters in case mongo reset
    if (Counters.find().count() === 0) {
      Counters.insert( { _id: "quote_id", seq: 0 } );
    }

    //process.env.HTTP_FORWARDED_COUNT = 2; // this seems to shift x-forwarded-for list for ip

    // Here we are going to get the client IP Address
    Meteor.onConnection(function(conn) {
      //console.log(conn.clientAddress); // this uses x-forwarded-for with forward count

      // Here is another way using headers
      var forwardedFor = conn.httpHeaders['x-forwarded-for'].split(",");
      clientIp = forwardedFor[0];
    });

    console.log(Meteor.settings.mailGunUrl);

/* had to remove due to unstyled accounts for some reason
  Accounts.config({
    forbidClientAccountCreation : false  // set this to true to disable signup
    });
*/

  });  // end of code to do at startup

  // This is a monitoring tool
  //Kadira.connect('wYiFPMyqaBcyKp7QK', '1f136ced-05f9-4e73-a92b-ef609cda56ce');

  


  // Get the server to publish our collections
  // Basically we only want to publish the quotes from our server which we are
  // actually interested in using on the client side.
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
    return Quotes.find({ _id: slug });
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


} // end of the server only code



// Meteor methods can be called by the client to do server things
// They can also be called by the server, I think... maybe, yes they can
Meteor.methods({

  addQuote: function (text, attribution) {
    // Make sure the user is logged in otherwise throw and error
    if (! Meteor.userId()) throw new Meteor.Error("not-authorized");

    if (text.length > maximumQuotationLength) throw new Meteor.Error('too-long');

    Counters.update({ _id: 'quote_id' }, { $inc: { seq: 1 } });

    var counter = Counters.findOne({ query: { _id: 'quote_id' } });

    var newQuote = Quotes.insert({
      attribution: attribution,
      quotation: text,
      createdAt: new Date(), // current time
      username: Meteor.user().username, // username of quote
      owner: Meteor.userId(),  // _id of logged in user
      quote_id: counter.seq.toString()
    });

    return newQuote;
  },


  deleteQuote: function(quoteId) {
    Quotes.remove(quoteId);
  },



  // Will use viewQuote instead probably
  // incQuoteViewCounter: function(quoteId) {
  //   Quotes.update( { _id: quoteId }, {$inc: { views: 1 } });
  // },

  // Here we are going to check the size of the quote and then
  // set a value to it so that we can display long quotes with smaller font
  // etc etc
  checkQuoteSize: function(quoteId) {

    check(quoteId, String);

    var currentQuote = Quotes.findOne(quoteId);
    var quotation = currentQuote.quotation;

    //console.log(currentQuote.length);

    if (true) { // use currentQuote.length == undefined to only update undefined
      var n = quotation.length;

      if (n > maximumQuotationLength) return false; // i don't like massive quotes and i cannot lie

      if (n <= 40) Quotes.update({ _id: quoteId }, { $set: { length: 'tiny' }});
      if (n > 40 && n <= 120) Quotes.update({ _id: quoteId }, { $set: { length: 'short' }});
      if (n > 120 && n <= 300) Quotes.update({ _id: quoteId }, { $set: { length: 'medium' }});
      if (n > 300 && n <= 500) Quotes.update({ _id: quoteId }, { $set: { length: 'long' }});
      if (n > 500) Quotes.update({ _id: quoteId }, { $set: { length: 'gigantic' }});
    }

    return true;
  },

  // testing ip getting on the client side
  // will be null if not behind a proxy as set in process.env.HTTP_FORWARDED_COUNT = 2;
  /*getClientIp: function() {
    clientIp = this.connection.clientAddress;
    console.log("Client IP is: " + clientIp);
  },-------------------doesn't work with client so deleting*/



// This isn't being used any more, but maybe in the future
  addAuthor: function(author) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    // We wanted to have the slug as something the URL defines
    function slugify(text)
    {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }

    slug = slugify(author);

      try {
      Authors.insert({
        name: author,
        slug: slug,
        createdAt: new Date(), // current time
      });
    } catch (e) {
      throw new Meteor.Error("already-exists", "The slug has to be unique: " + e);
    }
  },
  deleteAuthor: function (authorId) {
    Authors.remove(authorId);
  },





  // This is a feature to "Like" a quotation. It should put the quote in the user's
  // likes list and then update the upcount in the quote db
  // If a user has already like the quote, this function also "Unlikes" it
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

        // Even newer dogearing removes username from the quote
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

      // Even newer dogearing adds username to the quote
      Quotes.update({ _id: quoteId }, { $addToSet: { usersWhoDogeared: Meteor.user().username } });


      return true;
    }
  },



});









// Here come our routes which catch and process URLs -----------------



// First some static pages with About Us and Privacy etc.


Router.route('/about', function() {
  Session.set("DocumentTitle", "Qurious About Us?");
  this.render('Header', {to: 'header'});
  this.render('AboutText');
  this.render('Footer', {to: 'footer'});
});

Router.route('/privacy', function() {
  Session.set("DocumentTitle", "Privacy Policy - Qurious");
  this.render('Header', {to: 'header'});
  this.render('PrivacyText');
  this.render('Footer', {to: 'footer'});
});

Router.route('/terms', function() {
  Session.set("DocumentTitle", "Terms & Conditions - Qurious");
  this.render('Header', {to: 'header'});
  this.render('TermsText');
  this.render('Footer', {to: 'footer'});
});

Router.route('/contact', function() {
  Session.set("DocumentTitle", "Contacting Qurious");
  this.render('Header', {to: 'header'});
  this.render('ContactText');
  this.render('Footer', {to: 'footer'});
});



// This route is for useraccounts
AccountsTemplates.configureRoute('signIn', {
    name: 'signin',
    path: '/login',
    template: 'Login',
    redirect: '/random',
});





// Now here are the main routes

Router.route('/logout', function() {
  Meteor.logout();
  Router.go('/');
});


// Adding and submitting a new quote
Router.route('/create', {
  loadingTemplate: 'Loading',

  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('userData');
  },

  action: function () {
    Session.set("DocumentTitle", "Create a Quote - Qurious");
    this.render('Header', {to: 'header'});
    this.render('Create', {
      data: {
        isAdmin: function() {
          if (Meteor.user().admin) return true;
          else return false;
        }
      }
    });

    this.render('Footer', {to: 'footer'});
  }
});







// Quotes sorted by popularity, dogears etc.
Router.route('/explore', {
  loadingTemplate: 'Loading',

  waitOn: function () {

  },

  action: function () {
    Session.set("DocumentTitle", "Popular Quotes - Qurious");
    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({}, {sort: {views: -1, upcount: -1}, limit: Session.get('limit') });
        }
      }
    });

    this.render('Footer', {to: 'footer'});
  }
});




// Quotes sorted by popularity, dogears etc.
Router.route('/explore/popular', {
  loadingTemplate: 'Loading',

  waitOn: function () {

  },

  action: function () {
    Session.set("DocumentTitle", "Popular Quotes - Qurious");
    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({}, {sort: {views: -1, upcount: -1}, limit: Session.get('limit') });
        }
      }
    });

    this.render('Footer', {to: 'footer'});
  }
});




Router.route('/explore/latest', {
  loadingTemplate: 'Loading',

  waitOn: function () {

  },

  action: function () {
    Session.set("DocumentTitle", "Latest Quotes - Qurious");

    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find( { }, {sort: {createdAt: -1}, limit: Session.get('limit') });
        }
      }
    });

    this.render('Footer', {to: 'footer'});
  }
});



// Here is a nice little route that gives a single quote
// given a specified _id in the quotes collection as URL param
Router.route('/quotes/:_quote_slug', {
  loadingTemplate: 'Loading',
  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('quotesSlug', this.params._quote_slug);
  },
    onBeforeAction: function() {

      this.next(); // does this do anything? i don't think so
  },
    onAfterAction: function() {
      // if (Meteor.userId()) currentUserId = Meteor.userId();
      // Meteor.users.update({_id:currentUserId},{$addToSet:{quotesVisited:this.params._quote_slug}});
    },
  action: function () {
    this.render('Header', {to: 'header'});
    this.render('SingleQuote', {
      data: function () {
          var quote = Quotes.findOne({ _id: this.params._quote_slug });
          if (!quote) {
            this.render('NotFound');
          } else {
            Session.set('sessionQuoteId', this.params._quote_slug);
            Meteor.call('checkQuoteSize', this.params._quote_slug); // small or big?

            // Let's try to get substring some text for the Title Bar
            // this regular expression is gold (i didn't write it btw)
            var titleText = quote.quotation.replace(/^(.{50}[^\s]*).*/, "$1");

            Session.set("DocumentTitle", titleText + " - Qurious");

            return quote;
          }
        }
    });

    this.render('Footer', {to: 'footer'});
  }
});

// Identical route but handles extra text for SEO (but disregarded)
// Please keep up to date with previous or figure out how to replicate automatically
Router.route('/quotes/:_quote_slug/:_extra_text', {
  /* blah blah blah  probably better look for a wilcard thing */
});





Router.route('/random', {
  onBeforeAction: function () {
    Meteor.call('getRandomQuoteId', function (error, result) {
      var randomId = result;
      // replaceState keeps the browser from duplicating history
      Router.go('/quotes/' + randomId, {}, {replaceState:true});
    });

    this.next()
  },
  action: function () {
    this.render('Header', {to: 'header'});

  },
});


Router.route('/lucky', {
  onBeforeAction: function () {
    Meteor.call('getLuckyQuoteId', function (error, result) {
      var luckyId = result;
      // replaceState keeps the browser from duplicating history
      Router.go('/quotes/' + luckyId, {}, {replaceState:true});
    });

    this.next()
  },
  action: function () {
    this.render('Header', {to: 'header'});

  },
});





Router.route('/users/:_username', {
  loadingTemplate: 'Loading',

  waitOn: function () {


  },

  action: function () {
    Session.set("DocumentTitle","Exploring " + this.params._username + " - Qurious");


    var username_to_lookup = this.params._username; //to pass it into the function, someone help with this

    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({ username: username_to_lookup }, {sort: {createdAt: -1}, limit: Session.get('limit') });
        },
        usernameToShow: function () { return username_to_lookup },
      }
    });

    this.render('Footer', {to: 'footer'});
  }
});








Router.route('/users/:_username/dogears', {
  loadingTemplate: 'Loading',

  waitOn: function () {
    // This apparently we need for asyc stuff or something
    return Meteor.subscribe("userData");
  },

  onBeforeAction: function () {
    Session.set("DocumentTitle", this.params._username + " Dogears - Qurious");
    this.next();
  },

  action: function () {
    this.render('Header', {to: 'header'});
    //to pass it into the function, someone help with this
    var usernameParam = this.params._username;
    var user = Meteor.users.findOne( { username: this.params._username } );

    console.log(user.liked);

    Meteor.subscribe('quotesInArray', user.liked);


    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({ _id: { $in: user.liked } },
            { limit: Session.get('limit') }); //sort: { createdAt: -1 },
        },
        usernameToShow: function () { return usernameParam },

      }
    });

    this.render('Footer', {to: 'footer'});
  }
});



// What we want to do here is search
Router.route('/search/:_terms', {
  loadingTemplate: 'Loading',

  waitOn: function () {


  },

  action: function () {
    Session.set("DocumentTitle","Quotes with: " + this.params._terms + " - Qurious");


    var terms_to_lookup = this.params._terms; // someone explain why we need to do this please

    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({ $or: [ { quotation: { '$regex': terms_to_lookup, $options: 'i'} }, 
            { attribution: { '$regex': terms_to_lookup, $options: 'i'}} ] }, 
            {sort: {views: -1}, limit: Session.get('limit') });
        },
        exploreToShow: function () { return terms_to_lookup },
      }
    });
    this.render('Footer', {to: 'footer'});
  }
});



// The front landing page
Router.route('/', {
  action: function () {
    Session.set("DocumentTitle","Qurious");
    this.render('Header', {
      to: 'header',
      data: {
        frontPage: true // This boolean data is sent to the Header
      }
    });

    // Here we send a quote to the front page if required
    Meteor.subscribe('quotesPopular', 1);

    this.render('Home', {
      data: function () {
        return Quotes.findOne({});
      }
    });

    this.render('Footer', {to: 'footer'});
  }
});


// Just to test the loader
Router.route('/loading', function() {
  Session.set("DocumentTitle","Loading - Qurious");

  this.render('Loading');
});






// Let's test out an API call for funsies
Router.route('/api', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});




// This is our catch all for all other unknown things
// Probably won't be called all that much
// Especially after we implement qurious.cc/phocks user pages
Router.route('/(.*)', function() {
  Session.set("DocumentTitle","404 - Qurious");
  this.render('Header', {to: 'header'});
  this.render('404');
  this.render('Footer', {to: 'footer'});
});