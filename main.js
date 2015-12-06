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
Quotes = new Mongo.Collection('quotes');  // Our main quote db
Authors = new Mongo.Collection('authors'); // People who say stuff
Counters = new Mongo.Collection('counters'); // Handles numbering (which we no longer use)
// There is also a Users collection by default in Meteor



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
  Meteor.subscribe("userData"); // for admin account login access etc.
  Meteor.subscribe("authors"); // subscribe only to certain ones later




  // Font experiment to see if we can load fonts on demand
  // and YES it looks like we can.
  if (true) {  // We are enabling this now, as dropcap.js doesn't work well with @import CSS
    WebFontConfig = {
      google: { families: [ 'Vollkorn:400,400italic:latin' ] }
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

  Router.configure({ // commenting out default due to Lite layout change
    // sets default layout so you don't have to set it in the route
    // layoutTemplate: 'ApplicationLayout',
    // loadingTemplate: "Loading",
    // yieldTemplates: {
    //     Header: {to: 'header'},
    //     Footer: {to: 'footer'},
    // },
    //notFoundTemplate: '404' //this is used for somewhat custom 404s
  });


  Router.plugin('dataNotFound', {notFoundTemplate: 'NotFound'});


  // We have a package that gets us to the top when we navigate
  // This changes the animation period, set to zero for none
  // Doesn't seem to work with mobile (or sometimes at all)
  RouterAutoscroll.animationDuration = 200;


  // Call this at any time to set the <title>
  Session.set("DocumentTitle","Qurious");

  // Sets up automatically setting <title> in head
  // Simply do Session.set("DocumentTitle", "Whatever you want");
  Tracker.autorun(function(){
    document.title = Session.get("DocumentTitle");
  });



  // Setting up the useraccounts:core
  AccountsTemplates.configure({
    forbidClientAccountCreation: true,
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


  Template.ListAuthors.helpers({
    authors: function () {
      return Authors.find({}, {sort: {name: 1}});
    }
  });



  // And some global helpers etc

  // This sets the time format using the moment package
  Template.registerHelper('formatTime', function(context, options) {
    if(context)
      return moment(context).format('DD/MM/YYYY, hh:mm a');
  });

  Template.registerHelper('howLongAgo', function(context, options) {
    if(context)
      return moment(context).fromNow();
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
        if (confirm('Really delete ?')) {
          Meteor.call('deleteAuthor', this._id);
        }
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




  // Dropcaps for Quotes
  Template.LiteQuote.onRendered(function () {

    console.log('Inserting dropcaps span');
    var node = $("p").contents().filter(function () { return this.nodeType == 3 }).first(),
        text = node.text().trim(),
        first = text.slice(0, 1);
    
    if (!node.length) {
        console.log('not done');
        return;
      }
    
    node[0].nodeValue = text.slice(first.length);
    node.before('<span id="dropcap">' + first + '</span>');

    dropcap = document.getElementById("dropcap");
    window.Dropcap.layout(dropcap, 2, 2);

    // Media queries for javascript pretty much
    // Finally got it working. This triggers re-rendering for dropcaps
    // on window resize
    var tablet = window.matchMedia("(min-width: 768px)");
    var desktop = window.matchMedia("(min-width: 992px)");
    var largeDesktop = window.matchMedia("(min-width: 1200px)");  

    var handleMediaChange = function (mediaQueryList) {
        if (mediaQueryList.matches) {
          console.log("Media query greater than triggered")
          window.Dropcap.layout(dropcap, 2, 2);
        }
        else {
          // The browser window is less than 480px wide
          console.log("Media query js smaller than triggered")
          window.Dropcap.layout(dropcap, 2, 2);
        }
    }

    tablet.addListener(handleMediaChange);
    desktop.addListener(handleMediaChange);
    largeDesktop.addListener(handleMediaChange);

  
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



  // Meteor publish publication functions moved to /server/pulbications.js
  


} // end of the server only code