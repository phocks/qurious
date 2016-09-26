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


// Some npm imports

import slug from 'slug';
// slug('string', [{options} || 'replacement']);
slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};


/*
  MAIN JAVASCRIPT FILE PUT STUFF IN HERE THAT CONTROLS SHIT
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

  // Some client only configuration
  Meteor.startup(function () {

    // A package called juliancwirko:s-alert gives us smart alerts
    sAlert.config({
      effect: '',
      position: 'top-right',
      timeout: 5000,
      html: false,
      onRouteClose: true,
      stack: true,
      // or you can pass an object:
      // stack: {
      //     spacing: 10 // in px
      //     limit: 3 // when fourth alert appears all previous ones are cleared
      // }
      offset: 0, // in px - will be added to first alert (bottom or top - depends of the position in config)
      beep: false,
      // examples:
      // beep: '/beep.mp3'  // or you can pass an object:
      // beep: {
      //     info: '/beep-info.mp3',
      //     error: '/beep-error.mp3',
      //     success: '/beep-success.mp3',
      //     warning: '/beep-warning.mp3'
      // }
      onClose: _.noop //
      // examples:
      // onClose: function() {
      //     /* Code here will be executed once the alert closes. */
      // }
    }); 

  }); // end startup client code


  


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
  // RouterAutoscroll.animationDuration = 200;
  RouterAutoscroll.marginTop = 50;

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

  Template.registerHelper('slugThisString', function(stringToSluggify) {
    return slug(stringToSluggify); 
  });

  // End global helpers and now some Template specific helpers


  // Took me ages to work out how to scroll down on page load
  // Have to wait until all the elements are on the page
  // A bit hacky and I don't think we'll use it, but still
  // Template.Home.onRendered(function () {
  //   Meteor.setTimeout( function () { window.scroll(0, 50); }, 500);
  // });


  // Template.Home.onCreated( function () {
  //   quotationsHandler = Meteor.subscribe('quotesLimit', 20);
  // });


  Template.Settings.helpers({
    _id: function () {
      return Meteor.userId();
    }
  });



  // Events that drive things like clicks etc go below here


  Template.Home.events({
    // "click .scroll": function () {
    //   console.log('hi');
    //   $('html, body').animate({
    //       scrollTop: $("#down").offset().top
    //   }, 1000);
    // }
    
    // 'click a[href^="#"]': function(event) {
    //   var target = $(this.getAttribute('href'));
    //   if( target.length ) {
    //       event.preventDefault();
    //       $('html, body').stop().animate({
    //           scrollTop: target.offset().top
    //       }, 1000);
    //   }
    // }

    "click .load-more": function () {
      quotationsHandler.loadNextPage();
    }
  });


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













  // Add people to the beta invite list
  Template.Invite.events({
    "submit form": function (event) {
      event.preventDefault();
      
      // Get value from form element
      const target = event.target;
      const text = target.text.value;

      // var email = event.target.text.value;
      // var pageId = Session.get('pageId');
      // console.log(text);

      if (text == "") return false; // prevent empty strings


      Meteor.call('addInvite', text, function (error, result) {
          if (!error) {
            console.log("invited " + text);
            sAlert.info(text + " has been invited")
          }
        });      

      

      // Clear form
      event.target.text.value = "";

      // Prevent default action from form submit
      //return false; // use event.preventDefault() instead as more robust
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

  // Using fittext to resize or could use vw in the css
  // Template.Explore.onRendered( function () {
  //   $('h1').fitText(1.2, );
  //   // use { minFontSize: '20px', maxFontSize: '40px' } as second argument if you wanna
  // });


  Template.Explore.events({
    "click .delete": function () {
      if (confirm('Really delete ?')) {
        Meteor.call('deleteAuthor', this._id);
      }
    }
  });


  Template.Register.events({
    'submit form': function(event) {
      event.preventDefault();
      var emailVar = event.target.registerEmail.value.toLowerCase();
      var usernameVar = event.target.registerUsername.value;
      var passwordVar = event.target.registerPassword.value;
      // var passwordVarConfirm = event.target.registerPasswordConfirm.value;
      if (!emailVar) {
        sAlert.info('Email is required');
        return false; // replace with better validation
      }
      if (!usernameVar) {
        sAlert.info('Username is required');
        return false; // replace with better validation
      }
      if (!passwordVar) {
        sAlert.info('Password is required');
        return false; // replace with better validation
      }
      // We used to have 2 password fields but not required if email field
      // if (passwordVar !== passwordVarConfirm) {
      //   alert("Passwords don't match.");
      //   return false;
      // }

      // We use callbacks to wait until the email is checked on server
      Meteor.call('isInvited', emailVar, function (error) {
        if (!error) {
          Meteor.subscribe('invites', emailVar, createAccount);

          // emailVar = emailVar.toLowerCase();

          // Here we are hoisting a function (I think) instead of nesting it
          // so we don't create unnecessary Callback Hell
          function createAccount ( error ) {
            if (error) console.log(error);
            var emailInList = Invites.findOne({ email: emailVar });
            console.log(emailInList);

            if (emailInList) {
              Accounts.createUser({
                email: emailVar,
                username: usernameVar,
                password: passwordVar,
              }, function (error, result) {
                if (error) {
                  console.log(error);
                  sAlert.info(error.reason);
                }
              });
            } else {
              console.log( 'not in list' );
              sAlert.info('We are invite only for now. Please subscribe.')
            }
          }
          
        } else {
          console.log(error);
        }
      });

      
      // if (Session.get('Invited').indexOf(emailVar) > -1) {
      //   console.log("You're on the list!");
      // } else {
      //   console.log('Not on the invite list sorry.');
      //   sAlert.info('Not on the invite list sorry.');
      //   return false;
      // }

      
        
      console.log("Form submitted.");
    }
  });

  Template.Login.events({
    'submit form': function(event) {
      event.preventDefault();
      var userVar = event.target.loginUser.value;
      var passwordVar = event.target.loginPassword.value;
      if (!userVar) {
        sAlert.info("Something looks missing");
        return false;
      }
      Meteor.loginWithPassword(userVar, passwordVar, function (error) {
        if (error) {
          console.log(error);
          sAlert.info("Incorrect email or password");
        } 
      });
    }
  });

  Template.Forgot.events({
    'submit form': function(event) {
      event.preventDefault();
      var emailVar = event.target.forgotEmail.value;
      if (!emailVar) {
        sAlert.info("Did you forget something?");
        return false; // stops processing
      }
      Accounts.forgotPassword({
        email: emailVar
      }, function (error) {
        if (error) {
          console.log(error);
          sAlert.info(error.reason);
        } else {
          sAlert.info("Reset email sent");
          Meteor.setTimeout( function () { Router.go('/') }, 1000);
        }
      });
      sAlert.info("Sending reset email");
    }
  });


  Template.PasswordReset.events({
    'submit form': function(event) {
      event.preventDefault();
      var newPassword = event.target.newPassword.value;
      if (!newPassword) {
        sAlert.info("You need to enter a new password");
        return false; // stops processing
      }
      Accounts.resetPassword( Session.get('resetToken'), newPassword, function (error) {
        if (error) {
          console.log(error);
          sAlert.info(error.reason);
        } else {
          sAlert.info("Password changed");
          Meteor.setTimeout( function () { Router.go('/') }, 3000);
        }
      });
    }
  });



  Template.PageEdit.onRendered( function() {
    $("select").select2({dropdownCssClass: 'dropdown-inverse'});
  });


  Template.NewPage.onRendered( function() {
    $("select").select2({dropdownCssClass: 'dropdown-inverse'});
  });


  Template.NewPage.events({
    "submit form": function (event) {
      event.preventDefault();

      const pageText = event.target.text.value;
      const pageSlug = Session.get('pageSlug');
      const pageType = event.target.type.value;
      
      console.log("page text is " + pageText);
      console.log("Page slug is " + pageSlug);
      console.log("Page type is " + pageType);

      if (pageText === "" || pageType === "") return false; // prevent empty strings


      if ( Meteor.user().profile && Meteor.user().profile.lastSubmissionTime ) {
        var lastSub = moment(Meteor.user().profile.lastSubmissionTime);
        var compare = moment().subtract(60, 'seconds');

        // Prevent multiple submissions in short period
        if ( compare < lastSub ) { 
          console.log ('compare less than lastsub');
          sAlert.info('Hold up. Wait a minute or two.');
          return false;
        }
        else console.log('good to go');
      }


      Meteor.call('addPage', pageText, pageSlug, pageType, function(error, result) {
        if (error) {
          sAlert.info(error.reason);
        } else {
          var newPage = result;
          console.log("New page is: " + newPage);
          if (result) {
            Router.go('/' + pageSlug);
          }
        }
      });

      

      // Clear form
      event.target.text.value = "";

      // Prevent default action from form submit
      // return false; // now handled up top
    }
  });




  Template.PageEdit.events({
    "submit form": function (event) {
      event.preventDefault();

      const newPageName = event.target.text.value;
      const newPageType = event.target.type.value;
      // var pageId = Session.get('pageId');
      console.log(newPageName);

      if (newPageName === "" || newPageType === "") return false; // prevent empty strings


      if ( Meteor.user().profile && Meteor.user().profile.lastSubmissionTime ) {
        var lastSub = moment(Meteor.user().profile.lastSubmissionTime);
        var compare = moment().subtract(64, 'seconds');

        // Prevent multiple submissions in short period
        if ( compare < lastSub ) { 
          console.log ('compare less than lastsub');
          sAlert.info('Hold up. Wait a minute or two.');
          return false;
        }
        else console.log("Haven't seen you in a while, good to go");
      }


      Meteor.call('updatePage', 
        Session.get('pageSlug'), 
        newPageName, 
        newPageType);

      
      Router.go("/" + Session.get('pageSlug'));

      // Clear form
      // event.target.text.value = "";

      // Prevent default action from form submit
      // return false; // now handled up top
    },
    "click .delete": function () {
      if (confirm('Really delete ?')) {
        Meteor.call('deleteAuthor', Session.get("pageId"));
        Router.go('/explore')
      }
    }
  });

  

  // When adding quotations from the Author
  Template.AddQuote.events({
    "submit .add-quote": function (event) {
      event.preventDefault();
      
      var quoteText   = event.target.quoteText.value;
      var authorText  = event.target.authorText.value;
      var sourceText  = event.target.sourceText.value;
      var topicText   = event.target.topicText.value;
      var pageSlug    = Session.get('pageSlug');
      console.log("This is the quote text: " + quoteText);

      if (quoteText == "") return false; // prevent empty strings

      Meteor.call('addQuoteToPage', 
                  quoteText, 
                  authorText, 
                  sourceText, 
                  topicText, 
                  pageSlug, 
                  function(error, result) {
        var newQuoteSlug = result;
        console.log("New quote: " + newQuoteSlug);
        Meteor.call('checkQuoteSize', newQuoteSlug);
        Router.go('/' + pageSlug);
      });

      // Clear form
      event.target.quoteText.value = "";

      // Prevent default action from form submit
      return false;
    },
  });

  // When adding quotations from the Author
  Template.EditQuote.events({
    "submit .add-quote": function (event) {
      event.preventDefault();
      
      var quoteSlug   = Session.get('quoteSlug');
      var quoteText   = event.target.quoteText.value;
      var authorText  = event.target.authorText.value;
      var sourceText  = event.target.sourceText.value;
      var topicText   = event.target.topicText.value;
      console.log("This is the quote text: " + quoteText);

      if (quoteText == "") return false; // prevent empty strings

      Meteor.call('editQuote', 
                  quoteSlug,
                  quoteText, 
                  authorText, 
                  sourceText, 
                  topicText,
                  function(error, result) {
        var editedQuoteSlug = result;
        console.log("Edited quote: " + quoteSlug);
        Meteor.call('checkQuoteSize', quoteSlug);
        Router.go('/quote/' + quoteSlug);
      });

      // Clear form
      event.target.quoteText.value = "";

      // Prevent default action from form submit
      return false;
    },
  });


  Template.SingleQuote.events ({
    "click .fave": function () {
      if (!Meteor.userId()) {
        Router.go('/login');
      } 
      else {
        Meteor.call('faveQuote', Session.get('quoteId'));
      }
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

    // Did something change so we had to do this? this isn't working anyway wtf
    // process.env.ROOT_URL = "https://qurious.cc";

    // Here we are going to get the client IP Address
    Meteor.onConnection(function(conn) {
      //console.log(conn.clientAddress); // this uses x-forwarded-for with forward count

      // Here is another way using headers
      var forwardedFor = conn.httpHeaders['x-forwarded-for'].split(",");
      clientIp = forwardedFor[0];
    });

    // Email is handled via mailgun.com
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
