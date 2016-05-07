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



/*
|--------------------------------------------------------------------------
| Title template
|--------------------------------------------------------------------------
|
| Comments can go here and description
| that spans multi lines.
|
*/







// Initial setup of some things below
// like some variables etc

// loadMoreLimit = 5;  // for infinite scrolling, how many per load
maximumQuotationLength = 1000; // in characters... now probably going to be handled in simpleSchema



// Deny public from editing user profile. May prevent DoS attack
// Do it from the server side instead using Meteor Methods
Meteor.users.deny({
  update: function() {
    return true;
  }
});




// Here we have stuff that will only run on the client's browser

if (Meteor.isClient) { // only runs on the client



  // We need to tell the client to subscribe explicitly to data collections
  // Later we don't want to subscribe to the whole thing
  // moved to individual routes // Meteor.subscribe("quotes");
  // Meteor.subscribe("counters");
  // Meteor.subscribe("userData"); // for admin account login access etc.
  // Meteor.subscribe("authors"); // subscribe only to certain ones later
  // Meteor.subscribe("pages");




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
  // Accounts.ui.config({
  //   passwordSignupFields: "USERNAME_AND_EMAIL"
  // });


  // Some more configs to run initially

  Router.configure({ // commenting out default due to Lite layout change
    // sets default layout so you don't have to set it in the route
    layoutTemplate: 'Layout',
    // loadingTemplate: "Loading",
    yieldTemplates: { // These don't seem to work with iron-router-progress installed
        // Header: {to: 'header'},
        // Footer: {to: 'footer'},
        // Nav: {to: 'nav'},
    },
    //notFoundTemplate: '404' //this is used for somewhat custom 404s

    // for the loading up top thing
    progressSpinner: false,
    progressDelay: 100,
    loadingTemplate: 'Loading',
  });

  // Renders if route not found, but pretty much 100% sure route will be found
  Router.plugin('dataNotFound', {notFoundTemplate: 'NotFound'});


  // trying out this router hook thing to reset the post limit
  // Router.onBeforeAction(function() {
  //   Session.set('limit', loadMoreLimit); // set the infinite scroll limit back to default
  //   //$(window).scrollTop(0); // this replaces the auto scroll package

  //   this.next();
  // });


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






  // Here are the helpers to put data into Templates etc



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

  // This lets us access {{currentWord}} in the Spacebars html
  Template.registerHelper('currentWord', function () {
      return Session.get('currentWord');
    }
  );

  // Used in the html spacebars pass text to snip snip
  Template.registerHelper('truncate', function(passedString) {
    var n = 5; // how many words do you want?

    // Take only the first n words
    var shortenedText = passedString.replace(/\s+/g," ").split(/(?=\s)/gi).slice(0, n).join('');
    // This removes special characters except whitespace
    shortenedText = shortenedText.replace(/[^a-zA-Z\d\s]/g, "");
    return new Spacebars.SafeString(shortenedText);
  });

  // This was used to show unverified authors but not using any more
  Template.registerHelper('showUnverified', function () {
      if (Session.get('editMode')) {
        return true;
      } else {
        return false;
      }
    }
  );

  // End global helpers and now some Template specific helpers

  Template.Settings.helpers({
    _id: function () {
      return Meteor.userId();
    }
  })



  // Events that drive things like clicks etc go below here


  Template.Nav.events({
    "click .edit-mode": function () {
      if (Session.get('editMode')) {
        Session.set('editMode', false);
      } else 
       {
        Session.set('editMode', true);
      }
      console.log('Edit mode is: ' + Session.get('editMode'));
    }
  });



  // When adding quotations from the Author
  Template.AddQuote.events({
    "submit .add-quote": function (event) {
      var text = event.target.text.value;
      var pageId = Session.get('pageId');
      console.log("This is the quote text: " + text);

      if (text == "") return false; // prevent empty strings

      Meteor.call('addQuoteToPage', text, pageId, function(error, result) {
        var newQuoteId = result;
        console.log("New quote id: " + newQuoteId);
        Router.go('/explore');
      });

      // Clear form
      event.target.text.value = "";


      // Prevent default action from form submit
      return false;
    },
  });



  // Adding another author
  Template.Add.events({
    "submit form": function (event) {
      var text = event.target.text.value;
      // var pageId = Session.get('pageId');
      console.log(text);

      if (text == "") return false; // prevent empty strings

      Meteor.call('addPage', text, function(error, result) {
        var newPage = result;
        console.log("New page is: " + newPage);
        Router.go('/' + newPage);
      });

      // Clear form
      event.target.text.value = "";

      // Prevent default action from form submit
      return false;
    },
  });

  Template.Settings.events({
    'submit form': function(event) {
      event.preventDefault();
      // console.log(event);
      var fullName = event.target.fullName.value;
      Meteor.call('updateFullName', fullName);
    }
  });


  Template.Explore.events({
    "click .delete": function () {
      if (confirm('Really delete ?')) {
        Meteor.call('deleteAuthor', this._id);
      }
    }
  });


  Template.SignUp.events({
    'submit form': function(event) {
      event.preventDefault();
      var emailVar = event.target.signUpEmail.value;
      var passwordVar = event.target.signUpPassword.value;
      var passwordVarConfirm = event.target.signUpPasswordConfirm.value;
      if (!emailVar) return false; // replace with better validation

      if (passwordVar !== passwordVarConfirm) {
        alert("Passwords don't match.");
        return false;
      }
      
      if (Session.get('Invited').indexOf(emailVar) > -1) {
        console.log("You're on the list!");
      } else {
        console.log('Not on the invite list sorry.');
        alert('Not on the invite list sorry.')
        return false;
      }

      Accounts.createUser({
        email: emailVar,
        password: passwordVar
      }, function (error, result) {
        if (error) {
          console.log(error);
          alert(error);
        }
    
      });
        
      console.log("Form submitted.");
    }
  });

  Template.SignIn.events({
    'submit form': function(event) {
      event.preventDefault();
      var emailVar = event.target.signInEmail.value;
      var passwordVar = event.target.signInPassword.value;
      if (!emailVar) return false;
      Meteor.loginWithPassword(emailVar, passwordVar, function (error, result) {
        if (error) {
          console.log(error);
          alert(error);
        }
      });
      console.log("User logged in.");
    }
  });

} // Client only code end





/*
|--------------------------------------------------------------------------
| Server Only Main Code
|--------------------------------------------------------------------------
|
| This is code that only runs on the server
|
|
*/

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    // init the counters in case mongo reset
    // if (Counters.find().count() === 0) {
    //   Counters.insert( { _id: "quote_id", seq: 0 } );
    // }

    //process.env.HTTP_FORWARDED_COUNT = 2; // this seems to shift x-forwarded-for list for ip

    // Here we are going to get the client IP Address
    Meteor.onConnection(function(conn) {
      //console.log(conn.clientAddress); // this uses x-forwarded-for with forward count

      // Here is another way using headers
      var forwardedFor = conn.httpHeaders['x-forwarded-for'].split(",");
      clientIp = forwardedFor[0];
    });

    if (!Meteor.settings.mailGunUrl) console.log('Warning: email config not done.');
    else console.log("Email config address: " + Meteor.settings.mailGunUrl);

    // set this to true to disable password signup
    Accounts.config({forbidClientAccountCreation: false, });
    
    
    // Make sure some indexes are unique and can't be 2 or more of them
    // Words._ensureIndex({word: 1}, {unique: 1});


  });  // end of code to do at startup

  // This is a monitoring tool
  //Kadira.connect('wYiFPMyqaBcyKp7QK', '1f136ced-05f9-4e73-a92b-ef609cda56ce');


  // Meteor publish publication functions moved to /server/pulbications.js


} // end of the server only code
