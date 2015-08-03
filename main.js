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



// First up we are going to create a few collections
Quotes = new Mongo.Collection('quotes');
Counters = new Mongo.Collection('counters');


// Initial setup of some things below
// like some variables etc

loadMoreLimit = 5;







// Here we have stuff that will only run on the client's browser

if (Meteor.isClient) { // only runs on the client


  // We need to tell the client to subscribe explicitly to data collections
  // Later we don't want to subscribe to the whole thing
  // moved to individual routes // Meteor.subscribe("quotes");
  Meteor.subscribe("counters");
  Meteor.subscribe("userData"); // for admin access etc.




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
    //notFoundTemplate: '404' //this is used for somewhat custom 404s
  });


  Router.plugin('dataNotFound', {notFoundTemplate: 'NotFound'});


  // We have a package that gets us to the top when we navigate
  // This changes the animation period, set to zero for none 
  IronRouterAutoscroll.animationDuration = 200;


  // Call this at any time to set the <title>
  Session.set("DocumentTitle","Qurious - quotes etc.");

  // Sets up automatically setting <title> in head
  Tracker.autorun(function(){
    document.title = Session.get("DocumentTitle");
  });




  // Setting up the useraccounts:core
  AccountsTemplates.configure({
    forbidClientAccountCreation: false,
    enablePasswordChange: true,
    showForgotPasswordLink: true,
    lowercaseUsername: true,
  });


  AccountsTemplates.configure({ // Here we enter some custom error messages
      texts: {
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
      }
  });

  var pwd = AccountsTemplates.removeField('password');
  AccountsTemplates.removeField('email');
  AccountsTemplates.addFields([
    {
        _id: "username",
        type: "text",
        displayName: "username",
        required: true,
        minLength: 5,
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


  // We are setting up Infinite Scrolling
  
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
    // Tracker.autorun(function() {      
    //   Meteor.subscribe('quotesPopular', Session.get('limit'));
    //   Meteor.subscribe('quotesLatest', Session.get('limit'));
    //   Meteor.subscribe('quotesCurrentUser', Session.get('limit'));      
    // });
  }

  // This is an auto load feature when we have reached the bottom
  /* disabling for now
  Template.Quotes.rendered = function() {
    // is triggered every time we scroll
    $(window).scroll(function() {
      if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
        incrementLimit();
      }
    });
  }
  */

  Template.Quotes.events({
    'click .give-me-more': function(evt) {
      incrementLimit();
    }
  });





  // Here are the helpers



  UI.registerHelper('formatTime', function(context, options) {
    if(context)
      return moment(context).format('DD/MM/YYYY, hh:mm a');
  });


  Template.registerHelper('currentUsername', function () {
      return Meteor.user().username;
    }
  );

// Events that drive things like clicks etc

  // Let's finally set up a delete
  Template.SingleQuote.events({
    "click .delete": function () {
      Meteor.call('deleteQuote', this._id);
    }
  });
  

  // this isn't even used any more but yeah
  Template.Quotes.events({
    "click .delete": function () {
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



} // this marks the end of the client code





// ---------------- Code for the server only goes below
if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    // init the counters in case mongo reset
    if (Counters.find().count() === 0) {
      Counters.insert( { _id: "quote_id", seq: 0 } );
    } 

/* had to remove due to unstyled accounts for some reason
  Accounts.config({
    forbidClientAccountCreation : false  // set this to true to disable signup
    });
*/

  });  // end of code to do at startup



  // Here we are going to get the client IP Address
  Meteor.onConnection(function(conn) {
    var forwardedFor = conn.httpHeaders['x-forwarded-for'].split(",");
    clientIp = forwardedFor[0];
    console.log(clientIp);
  });




  // Get the server to publish our collections
  Meteor.publish("quotesAll", function () {  
    return Quotes.find({}, { sort: {createdAt: -1} });
    self.ready();
  });


  Meteor.publish("quotesLatest", function (limit) {
    if (limit > Quotes.find().count()) {
      limit = 0;
    }
    return Quotes.find({}, { sort: {createdAt: -1}, limit: limit });
    self.ready();
  });


  Meteor.publish("quotesPopular", function (limit) {
    if (limit > Quotes.find().count()) {
      limit = 0;
    }    
    
    return Quotes.find({}, { sort: {views: -1}, limit: limit });
    self.ready();
  });


  Meteor.publish("quotesCurrentUser", function () {
    return Quotes.find({ owner: this.userId });
    self.ready();
  });


  Meteor.publish("quotesSlugUser", function (user_slug) {
    return Quotes.find({ username: user_slug }, { sort: {createdAt: -1}});
    self.ready();
  });


  Meteor.publish("quotesSlug", function (slug) {
    return Quotes.find({ _id: slug });
    self.ready();
  });


  Meteor.publish("counters", function () {
    return Counters.find();
  });

  // We are going to publish some more userData
  // in order to check if user is admin we need this
  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId},
                               {fields: {'admin': 1}});
    } else {
      this.ready();
    }
  });


} // end of the server only code



// Meteor methods can be called by the client to do server things
// They can also be called by the server, I think
Meteor.methods({
  addQuote: function (text, attribution) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    
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


  incQuoteViewCounter: function(quoteId) {
    Quotes.update( { _id: quoteId }, {$inc: { views: 1 } });
  },

  // Here we are going to check the size of the quote and then
  // set a value to it so that we can display long quotes with smaller font
  // etc etc
  checkQuoteSize: function(quoteId) {    

    var currentQuote = Quotes.findOne(quoteId);
    var quotation = currentQuote.quotation;

    console.log(currentQuote.length);
    
    if (true) { // use currentQuote.length == undefined to only update undefined
      var n = quotation.length;

      //console.log(quoteId);
      //console.log(quotation);
      //console.log(n);

      if (n <= 40) Quotes.update({ _id: quoteId }, { $set: { length: 'tiny' }});
      if (n > 40 && n <= 120) Quotes.update({ _id: quoteId }, { $set: { length: 'short' }});
      if (n > 120 && n <= 300) Quotes.update({ _id: quoteId }, { $set: { length: 'medium' }});
      if (n > 300 && n <= 500) Quotes.update({ _id: quoteId }, { $set: { length: 'long' }});
      if (n > 500) Quotes.update({ _id: quoteId }, { $set: { length: 'gigantic' }});
    }
  },



// This isn't being used any more, but maybe in the future
  addAuthor: function (author) {
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




// We are not using this either
  changeTheme: function (quoteId, quoteTheme) {
    if (quoteTheme == "blue") {
      Quotes.update({ _id: quoteId }, { $set: { theme: 'green' }});
    } else {
      Quotes.update({ _id: quoteId }, { $set: { theme: 'blue' }});
    }
  }
});






// trying out this router hook thing to reset the post limit

Router.onBeforeAction(function() {
  Session.set('limit', loadMoreLimit); // set the infinite scroll limit back to default
  //$(window).scrollTop(0); // this replaces the auto scroll package

  this.next();
});


// Here come our routes which catch and process URLs -----------------
// First some static pages with About Us and Privacy etc.


Router.route('/about', function() { 
  this.render('Header', {to: 'header'}); 
  this.render('TextContent');
});




// Now here are the main routes


Router.route('/login', function() {
  this.render('Header', {to: 'header'});
  this.render('Login');
});


Router.route('/logout', function() {
  Meteor.logout();
  Router.go('/');
});



Router.route('/create', {
  loadingTemplate: 'Loading',

  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('userData');
  },

  action: function () {
    this.render('Header', {to: 'header'});
    this.render('Create', {
      data: {
        isAdmin: function() {
          if (Meteor.user().admin) return true;
          else return false;
        }
      }
    });
    console.log(Meteor.user().admin); // testing the admin setting
  }
});


Router.route('/popular', {
  loadingTemplate: 'Loading',

  waitOn: function () {
    // return one handle, a function, or an array
    //return Meteor.subscribe('quotesAll');
    //quotesPaginated = Meteor.subscribeWithPagination('quotesAll', 5);
    //return quotesPaginated;


    Tracker.autorun(function() {      
      Meteor.subscribe('quotesPopular', Session.get('limit'));     
    });

    

    return Meteor.subscribe('quotesPopular', 5);

    

    //return Meteor.subscribe('quotesPopular', 1);     
  },

  action: function () {
    this.render('Header', {to: 'header'});    
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({}, {sort: {views: -1}, limit: Session.get('limit') });
        }
      }
    });
  }
});



Router.route('/latest', {
  loadingTemplate: 'Loading',

  waitOn: function () {

    Tracker.autorun(function() {
      Meteor.subscribe('quotesLatest', Session.get('limit'));
    });
    
    return Meteor.subscribe('quotesLatest', 5);
    

    // return one handle, a function, or an array
    //return Meteor.subscribe('quotesLatest', 1);
  },

  action: function () {
    this.render('Header', {to: 'header'});   
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find( { }, {sort: {createdAt: -1}, limit: Session.get('limit') });
        }
      }
    });
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
    //Meteor.call('incQuoteViewCounter', this.params._quote_slug); // +1 to view count
    Meteor.call('checkQuoteSize', this.params._quote_slug); // small or big?
    this.next();
  },
  action: function () {
    this.render('Header', {to: 'header'});
    this.render('SingleQuote', {
      data: function () {
        var quote = Quotes.findOne({ _id: this.params._quote_slug });
        if (!quote) {
          this.render('NotFound');
        } else {      
          return quote;
        }    
      }
    });  
  }
});

// Identical route but handles extra text for SEO (but disregarded)
// Please keep up to date with previous or figure out how to replicate automatically
Router.route('/quotes/:_quote_slug/:_extra_text', {
  loadingTemplate: 'Loading',
  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('quotesSlug', this.params._quote_slug);
  },
    onBeforeAction: function() {
    Meteor.call('incQuoteViewCounter', this.params._quote_slug);
    this.next()   
  },
  action: function () {
    this.render('Header', {to: 'header'});
    this.render('SingleQuote', {
      data: function () {
        var quote = Quotes.findOne({ _id: this.params._quote_slug });
        if (!quote) {
          this.render('NotFound');
        } else {      
          return quote;
        }    
      }
    });  
  }
});




Router.route('/mine', {
  loadingTemplate: 'Loading',

  waitOn: function () {
      
    return Meteor.subscribe('quotesCurrentUser', 5);


    // return one handle, a function, or an array
    //return Meteor.subscribe('quotesCurrentUser');
  },

  action: function () {
    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({ owner: Meteor.userId() }, {sort: {createdAt: -1}, limit: Session.get('limit') });
        }
      }
    });
  }
});




Router.route('/users/:_username', {
  loadingTemplate: 'Loading',

  waitOn: function () {

    // var username_to_lookup = this.params._username; //to pass it into the autorun for some reason..???

    // Tracker.autorun(function() {      
    //   Meteor.subscribe('quotesSlugUser', username_to_lookup);
    // });
      
    return Meteor.subscribe('quotesSlugUser', this.params._username);


    // return one handle, a function, or an array
    //return Meteor.subscribe('quotesCurrentUser');
  },

  action: function () {
    var username_to_lookup = this.params._username; //to pass it into the function, someone help with this

    this.render('Header', {to: 'header'});
    this.render('Quotes', {
      data: {
        quotes: function () {
          return Quotes.find({ username: username_to_lookup }, {sort: {createdAt: -1}, limit: Session.get('limit') });
        }
      }
    });
  }
});



Router.route('/', {
  /*waitOn: function () {
    return Meteor.subscribe('quotes');
  },*/
  action: function () {
    this.render('Header', { 
      to: 'header',
      data: {
        frontPage: true
      }
    });




    this.render('Home');
/*
    this.render('Home', {
      data: function() {
        var count = Quotes.find().count();
        var random_index = Math.floor(Math.random() * (count));
        var random_object = Quotes.findOne({}, {skip:random_index}
        );
        return random_object;
      }
    });
*/
  }
});


// Just to test the loader
Router.route('/loading', function() {  
  this.render('Loading');
});



// This is our catch all for unknown things
Router.route('/(.*)', function() {
  this.render('Header', {to: 'header'});
  this.render('404');
});