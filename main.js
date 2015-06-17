// Welcome to this file. The large main file with a lot of things that
// probably should be moved to different locations. But we will
// get to that later... maybe.
// 
// This file was originally created by Josh - phocks@gmail.com

// First up we are going to create a few collections
Quotes = new Mongo.Collection('quotes');
Authors = new Mongo.Collection('authors');
Counters = new Mongo.Collection('counters');

// Set up Easy-Search
Quotes.initEasySearch(['author', 'quotation'], {
    'limit' : 10,
    'use' : 'mongo-db'
    
});

// Here we have stuff that will only run on the client's browser

if (Meteor.isClient) { // only runs on the client


  // We need to tell the client to subscribe explicitly to data collections
  // Later we don't want to subscribe to the whole thing
  Meteor.subscribe("quotes");
  Meteor.subscribe("authors");
  Meteor.subscribe("counters");



  // Here we work out what kind of signups we want to use
  // One of 'USERNAME_AND_EMAIL', 'USERNAME_AND_OPTIONAL_EMAIL', 
  // 'USERNAME_ONLY', or 'EMAIL_ONLY' (default).
  Accounts.ui.config({
    passwordSignupFields: "EMAIL_ONLY"
  });


Router.configure({
  layoutTemplate: 'ApplicationLayout',
  loadingTemplate: "Loading",
});


Router.plugin('dataNotFound', {notFoundTemplate: 'NotFound'});




// Here are the helpers

  Template.Home.helpers({
    latestQuote: function() {
      var count = Quotes.find().count();
      var random_index = Math.floor(Math.random() * (count));
      var random_object = Quotes.findOne(
          {skip:random_index}
      );
      return random_object;
    }
    
  });

  Template.Home.events({
      "click .container": function () {
      Meteor.call('changeTheme', this._id, this.theme);
    }
    });


  Template.Quotes.helpers({
      quotes: function () {
        return Quotes.find({}, {sort: {createdAt: -1}});
      }
    });

  Template.ListAuthors.helpers({
      authors: function () {
        return Authors.find({}, {sort: {createdAt: -1}});
      }
    });

  UI.registerHelper('formatTime', function(context, options) {
    if(context)
      return moment(context).format('DD/MM/YYYY, hh:mm');
  });






// Events that drive things  

  Template.Quotes.events({
    "submit .new-quote": function (event) {
      var text = event.target.text.value;
      var author = event.target.author.value;
      if (text == "" || author == "") return false; // prevent empty strings

      Meteor.call('addQuote', text, author);

      // Clear form
      event.target.text.value = "";
      event.target.author.value = "";

      // Prevent default action from form submit
      return false;
    },
    "click .delete": function () {
      Meteor.call('deleteQuote', this._id);
    },
    "click .list-quote": function () {
      Router.go('/quotes/' + this.quote_id);
    }
  });




    Template.Submit.events({
    "submit .new-quote": function (event) {
      var text = event.target.text.value;
      var author = event.target.author.value;
      if (text == "" || author == "") return false; // prevent empty strings

      Meteor.call('addQuote', text, author);

      // Clear form
      event.target.text.value = "";
      event.target.author.value = "";

      Router.go('/quotes')

      // Prevent default action from form submit
      return false;
    },
    "click .delete": function () {
      Meteor.call('deleteQuote', this._id);
    }
  });


  
Template.Create.events({
    "submit .new-author": function (event) {      
      var author = event.target.author.value;
      if (author == "") return false; // prevent empty strings

      Meteor.call('addAuthor', author);

      // Clear form      
      event.target.author.value = "";

      // Prevent default action from form submit
      return false;
    },
    "click .delete": function () {
      Meteor.call('deleteAuthor', this._id);
    }
  });



Template.ListAuthors.events({
  "submit .new-author": function (event) {      
    var author = event.target.author.value;
    if (author == "") return false; // prevent empty strings

    Meteor.call('addAuthor', author);

    // Clear form      
    event.target.author.value = "";

    // Prevent default action from form submit
    return false;
  },
  "click .delete": function () {
    Meteor.call('deleteAuthor', this._id);
  }
});


Template.TopNavigation.events({
  "submit .main-search": function(event) {
    query = event.target.searchQuery.value;
    Router.go('/search?=' + query);
    // Prevent default action from form submit
    return false;
  }
})



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



  // Get the server to publish our collections
  Meteor.publish("quotes", function () {
    return Quotes.find({} /*,  {sort: {createdAt: -1}, limit: 3} */);
  });

  Meteor.publish("authors", function () {
    return Authors.find();
  });

  Meteor.publish("counters", function () {
    return Counters.find();
  });


} // end of the server only code



// Meteor methods can be called by the client to do server things
// They can also be called by the server
Meteor.methods({
  addQuote: function (text, author) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    
    Counters.update({ _id: 'quote_id' }, { $inc: { seq: 1 } });

    
    var counter = Counters.findOne({ query: { _id: 'quote_id' } });
                
       

    

    Quotes.insert({      
      author: author,
      quotation: text,
      createdAt: new Date(), // current time
      owner: Meteor.userId(),  // _id of logged in user      
      quote_id: counter.seq.toString()
    });
  },



  deleteQuote: function (quoteId) {
    Quotes.remove(quoteId);
  },




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





  changeTheme: function (quoteId, quoteTheme) {
    if (quoteTheme == "blue") {
      Quotes.update({ _id: quoteId }, { $set: { theme: 'green' }});
    } else {
      Quotes.update({ _id: quoteId }, { $set: { theme: 'blue' }});
    }
  }
});




// Here come our routes which catch and process URLs

AccountsTemplates.configureRoute('signIn', {
    name: 'signin',
    path: '/login',
    template: 'Login',
    layoutTemplate: 'ApplicationLayout',
    redirect: '/',
});

AccountsTemplates.configure({
  forbidClientAccountCreation: false,
  enablePasswordChange: true,
  showForgotPasswordLink: true,
});


AccountsTemplates.configure({
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


Router.route('/create', function () {
  this.render('Create');
});

Router.route('/authors', function () {
  this.render('ListAuthors');
});



Router.route('/quotes/:_quote_slug', function () {
  this.layout('ApplicationLayout');
  this.render('SingleQuote', {
    data: function () {
      var quote =  Quotes.findOne({ quote_id: this.params._quote_slug });
      if (!quote) {
        this.render('NotFound');
      } else {
        return quote;
      }
       
    }
  });
});



Router.route('author/:_slug', function () {
  this.render('Author', {
    data: function () {
      return Authors.findOne({ slug: this.params._slug });
    }
  });
});


Router.route('/submit', function () {    
  this.render('Submit');
});

Router.route('/about', function () {    
  this.render('About');
});


Router.route('/quotes', function () {
  this.layout('ApplicationLayout');  
  this.render('Quotes');
});

Router.route('/explore', function () {
  this.layout('ApplicationLayout');  
  this.render('Explore');
});

Router.route('/search', function () {
  this.layout('ApplicationLayout');  
  this.render('Search');
});


Router.route('/', function () {
  this.layout('ApplicationLayout');  
  this.render('Home', {
    data: function() {
      var count = Quotes.find().count();
      var random_index = Math.floor(Math.random() * (count));
      var random_object = Quotes.findOne({}, {skip:random_index}
      );
      return random_object;
    }
  });
});