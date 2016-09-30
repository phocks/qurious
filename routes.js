// This file handles all the URL routes. It uses the iron:router Meteor package.

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

// Let's test out an API call for use in the future
Router.route('/api', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});



/* The root home route landing for qurious.cc/   */
Router.route('/', {
  waitOn: function () {
    if (Meteor.user()) {
      // return Meteor.subscribe('quotesInPages', 0); // Moved to a helper for pagination
    }
  },
  // onBeforeAction: function() {
  //   if (! Meteor.userId()) {
  //     this.render('Loading');
  //     console.log('logging in');
  //   } else {
  //     this.next();
  //   }
  // },
  action: function () {
    Session.set("DocumentTitle","Qurious");


    // console.log(Meteor.user().services.twitter.profile_image_url);
    // this.render('Nav', { to: 'nav'});
    
    this.render('Home', {
      data: {
        quotes: function () {
          // var quotes = Quotes.find({}, { sort: {faveCount: -1}}, { limit: 2 } );
          var quotes = Quotes.find({});
          return quotes;
        },
      }
    });
    this.render('FooterNavigation', { to: 'footer'});
  }
});


Router.route('/explore', {
  waitOn: function () {
    return Meteor.subscribe('quotesLatest', 64);
  },
  action: function () {
    Session.set("DocumentTitle","Qurious");

    this.render('Explore', {
      data: {      
        // pages: function () {
        //   var pages = Pages.find({ verified:true }, { sort: {name: 1}});
        //   return pages;
        // },
        quotes: function () {
          var quotes = Quotes.find({}, {sort: {faveCount: -1}}, { limit: Meteor.get('quoteLimit') });
          return quotes;
        },
      }
    });
  }
});






Router.route('/forgot', {
  // Automatically renders the "Forgot" template
});

Router.route('/password-reset/:_token', {
  action: function () {
    Session.set('resetToken', this.params._token);
    this.render('PasswordReset', {
      data: {
        resetToken: this.params._token,
      }
    });
  }
});


Router.route('/settings', {
  waitOn: function () {
    // return Meteor.subscribe('profiles');
  },
  action: function () {
    Session.set("DocumentTitle","Qurious");

    // if (!Meteor.user() ) Router.go('/sign-in');
    this.render('Nav', { to: 'nav'});
    this.render('Settings', {
      data: {
        // don't need user data as it is auto published in currentUser.profile
        // fullName: function () {
        //   return Meteor.user().profile.fullName;
        // }
      }
    });
  }
});


Router.route('/subscribe', {
  action: function () {
    this.render('Subscribe');
  }
});








Router.route('/faq', {
  action: function () {
    // this.render('Nav', { to: 'nav'});
    this.render('Faq');
  }
});



Router.route('/register', {
  waitOn: function () {
    // return Meteor.subscribe('invites');
  },
  action: function () {
    if (Meteor.user() ) Router.go('/'); // deny logged in

    // We check the Invite list (fix so it's secure later)
    // var invited = Invites.find({ }).fetch();    

    // var arrayInvited = [];

    // invited.forEach( function (invitee) {
    //   arrayInvited.push(invitee.email);
    // });    

    // Session.set('Invited', arrayInvited);

    // This has now been secured so it only returns input emails


    this.layout('Layout');
    this.render('Register');
    
  }
});




Router.route('/notfound', {
  action: function () {
    this.render('404');
  }
});


Router.route('/login', {
  waitOn: function () {

  },
  action: function () {
    if (!Meteor.loggingIn()) { // I don't know about this, but should learn
      if (Meteor.user() ) Router.go('/'); // deny logged in
    }
    this.layout('Layout');
    Session.set("DocumentTitle","Qurious");

    // this.render('Nav', { to: 'nav'});
    this.render('Login');
  }
});


Router.route('/admin', {
  action: function () {
    var loggedInUser = Meteor.userId();
    if (!Roles.userIsInRole(loggedInUser, 'admin')) Router.go('/');
    this.render('404');
  }
});


Router.route('/invite', {
  action: function () {
    Session.set("DocumentTitle","Invite people to Qurious");
    // Meteor.subscribe('invitesAll');
    // var loggedInUser = Meteor.userId();
    // if (!Roles.userIsInRole(loggedInUser, 'admin')) Router.go('/');
    this.render('Invite');
  }
});



// Quick and easy logouts
Router.route('/logout', function() {
  Meteor.logout();
  Meteor.setTimeout( function () { Router.go('/') }, 1000);
});


// How to add an author, or maybe a quote
Router.route('/:_slug/add', {
  waitOn: function () {
    return Meteor.subscribe('pagesWithPageSlug', this.params._slug);
  },
  action: function () {
    // Prevent anonymous adds
    if ( !Meteor.userId() ) Router.go('/login');


    var slug = this.params._slug;
    currentPage = Pages.findOne({slug: slug});

    if (!currentPage) {
      this.render('404');
    } else {
      Session.set("DocumentTitle", "Add a " + currentPage.name + " quotation - Qurious");
      Session.set("pageSlug", this.params._slug);

      // this.render('Nav', { to: 'nav'});
      this.render('AddQuote', {
        data: {
          currentPage: function() { return currentPage },
          isAuthor: function() { if (currentPage.type === "author") return true },
          isSource: function() { if (currentPage.type === "source") return true },
          isTopic: function() { if (currentPage.type === "topic") return true },
        }
      });
    }
  }
});

// Edit page for authors/pages/whatever
Router.route('/:_slug/edit', {
  waitOn: function () {
    Session.set('pageSlug', this.params._slug);
    return Meteor.subscribe('pagesWithPageSlug', this.params._slug);
  },
  action: function () {
    var slug = this.params._slug;
    currentPage = Pages.findOne({slug: slug});

    // Send the public to login so they can't add rubbish
    // Might not be 100% secure so try putting this in methods too?
    if ( !Meteor.userId() ) Router.go('/login');

    if (currentPage) {
      Session.set("DocumentTitle", "Editing " + currentPage.name + " - Qurious");
      Session.set("pageId", currentPage._id);
      this.render('PageEdit', {
        data: {
          page: currentPage,
          authorSelected: function () {
            return (currentPage.type === "author") ? 'selected' : '';
          },
          sourceSelected: function () {
            return (currentPage.type === "source") ? 'selected' : '';
          },
          topicSelected: function () {
            return (currentPage.type === "topic") ? 'selected' : '';
          },
          pageSlug: function () {
            return Session.get('pageSlug');
          }
        }
      });
    } else {
      this.render('NewPage', {
        data: {
          pageName: function () { 
            return Session.get('currentPageName'); 
          },
          pageSlug: function () {
            return Session.get('pageSlug');
          }
        }
      });
    }
    // this.render('Nav', { to: 'nav'});
  }
});


Router.route('/quote/:_quote_slug', {
  waitOn: function () {
    return Meteor.subscribe('quoteSingle', this.params._quote_slug);
  },
  action: function () {
    const quoteSlug = this.params._quote_slug;

    // console.log("Current quoteSlug is: " + quoteSlug );
    Session.set('quoteSlug', quoteSlug);

    var quote = Quotes.findOne({ slug: quoteSlug });

    if (quote) {
      Meteor.call('checkQuoteSize', quoteSlug);
      Session.set('quoteId', quote._id);
    } 
    else {
      Meteor.setTimeout( function () { Router.go('/notfound'), {}, {replaceState: true}}, 1000);
    }

    // If quote has an author we wanna redirect to have that as the slug
    if (quote.authorSlug) {
      console.log(quote.authorSlug);
      Router.go("/" + quote.authorSlug + "/" + quoteSlug, {}, {replaceState: true});
    }

    Session.set("DocumentTitle", "Qurious");

    this.render('SingleQuote', {
      data: {
        quote: function () {
          var quote = Quotes.findOne({ slug: quoteSlug });
          return quote;
        },
        faved: function () {
          const quoteIsFaved = Quotes.findOne({ slug: quoteSlug, favedBy: Meteor.userId() });
          if (quoteIsFaved && Meteor.user()){
            return true;
          } else return false;
        }
      }
    });
  }
});




Router.route('/quote/:_quote_slug/edit', {
  waitOn: function () {
    Session.set('quoteSlug', this.params._quote_slug);
    return Meteor.subscribe('quoteSingle', this.params._quote_slug);
  },
  action: function () {
    const quoteSlug = this.params._quote_slug;
    const quote = Quotes.findOne({ slug: quoteSlug });

    if (quote) {
      Meteor.call('checkQuoteSize', quoteSlug);
      Session.set('quoteId', quote._id);
    } 
    else {
      Meteor.setTimeout( function () { Router.go('/notfound'), {}, {replaceState: true}}, 1000);
    }


    // Send the public to login so they can't add rubbish
    // Might not be 100% secure so try putting this in methods too?
    if ( !Meteor.userId() ) Router.go('/login');

    this.render('EditQuote', {
      data: {
        quote: function () {
          var quote = Quotes.findOne({ slug: quoteSlug });
          return quote;
        }
      }
    });
  }
});




// Display the single quote you found
// Moving to /quote/_quote_slug probably
Router.route('/:_page_slug/:_quote_slug', {
  waitOn: function () {
    
    // return [Meteor.subscribe('pagesWithPageSlug', this.params._page_slug),
    //         Meteor.subscribe('quotesSlug', this.params._quote_slug)];
    return Meteor.subscribe('quoteSingle', this.params._quote_slug);
  },
  action: function () {
    // var pageSlug = this.params._page_slug;
    var quoteSlug = this.params._quote_slug;
    console.log("Current quoteSlug is: " + quoteSlug );
    // var currentPage = Pages.findOne({slug: pageSlug});
    var quote = Quotes.findOne({ slug: quoteSlug });

    if (quote) {
      Meteor.call('checkQuoteSize', quoteSlug);
      Session.set('quoteId', quote._id);
    } else {
      Meteor.setTimeout( function () { Router.go('/notfound'), {}, {replaceState: true}}, 1000);
    }

    // Session.set("DocumentTitle", "A quote by " + currentPage.name + " - Qurious");
    // Session.set("pageId", currentPage._id);

    Session.set("DocumentTitle", "Qurious");

    

    // this.render('Nav', { to: 'nav'});
    // this.render('DisplayQuote', {
    //   data: {
    //     page: function () {
    //       return Pages.findOne({ slug: pageSlug });
    //       },
    //     quote: function () {
    //       var quote = Quotes.findOne({ slug: quoteSlug });
    //       return quote;
    //     }
    //   }
    // });

    this.render('SingleQuote', {
      data: {
        quote: function () {
          var quote = Quotes.findOne({ slug: quoteSlug });
          return quote;
        },
        faved: function () {
          const quoteIsFaved = Quotes.findOne({ slug: quoteSlug, favedBy: Meteor.userId() });
          if (quoteIsFaved && Meteor.user()){
            return true;
          } else return false;
        }
      }
    });
  }
});







// A URL with something after it
// Don't put things below this as they probs won't work
Router.route('/:_pageUrlText', {
  waitOn: function () {
    Session.set('pageSlug', this.params._pageUrlText);
    Session.set("DocumentTitle", "Qurious");

    

    // put each subscription in an array to wait until all are done
    return [Meteor.subscribe('pagesWithPageSlug', this.params._pageUrlText),
            Meteor.subscribe('quotesSlug', this.params._pageUrlText),
            Meteor.subscribe('quotesWithSlugInAuthorEtc', this.params._pageUrlText)];
            
  },
  action: function () {
    const pageUrlText = this.params._pageUrlText; // haven't sluggified it yet 
    const pageSlug = slug(pageUrlText);

    // Meteor.subscribe('pagesWithPageSlug', pageSlug);

    currentPage = Pages.findOne({slug: pageSlug});



    if (pageSlug !== pageUrlText) {
      console.log("Setting current page name to " + pageUrlText);
      Session.set("currentPageName", pageUrlText);
    }

    // console.log("Current page name is " + Session.get("currentPageName"));  // testing




    if (pageUrlText !== pageSlug) {
      console.log('We are now navigating')
      Router.go("/" + pageSlug, {}, {replaceState: true}); // second argument needed here
    }

    if (currentPage) {
      // Set browser tab title depending on page type
      if (currentPage.type === "author") {
        Session.set("DocumentTitle", "Quotes by " + currentPage.name);
      } 
      else if (currentPage.type === "source") { 
        Session.set("DocumentTitle", "Quotes from " + currentPage.name);
      }
      else if (currentPage.type === "topic") { 
        Session.set("DocumentTitle", "Quotes on " + currentPage.name);
      } 
      else Session.set("DocumentTitle", currentPage.name);

      this.render('Page', {
        data: {
          page: function () {
            // return Pages.findOne({slug: Session.get('pageSlug')});
            return currentPage;
            },
          quotes: function () {
            var quotes = Quotes.find( { $or: [
              { pageSlugs: Session.get('pageSlug') },
              { authorSlug: currentPage.slug }, // 3 permanent slugs and then an array of others
              { sourceSlug: currentPage.slug }, // for some reason this will be best I think
              { topicSlug: currentPage.slug }
              ] }, {sort: {favedBy: -1}} );
            return quotes;
          },
        }
      });
    } 

    else if (!currentPage) {
      // Session.set("DocumentTitle", Session.get('pageSlug') + " - Qurious");
      this.render('PageNotFound', {
        data: {
          pageName: function () { return Session.get('currentPageName'); },
          pageSlug: Session.get('pageSlug')
        }
      });
    }
  }  // end of action
});





// This is our catch all for all other unknown things
// Probably won't be called all that much
// Especially after we implement qurious.cc/phocks user pages
Router.route('/(.*)', function() {
  this.layout('Layout');
  Session.set("DocumentTitle","Qurious - 404 not found");
  this.render('404');
});





// Please refrain from putting any routes below here as they will (probably) not work


// Router.route('/explore/pending', {
//   waitOn: function () {
//     return Meteor.subscribe('pagesPending'); 
//   },
//   action: function () {
//     Session.set("DocumentTitle","Qurious");

//     // console.log(Meteor.user().services.twitter.profile_image_url);

//     this.render('Header', { to: 'header'});

//     // this.render('Nav', { to: 'nav'});

//     this.render('ExplorePending', {
//       data: {
//         pages: function () {
//           var pages = Pages.find({ $or: [ { verified:false } , { verified: { $exists:false } }] });
//           return pages;
//         },        
//       }
//     });
//   }
// });



// Router.route('/explore/all', {
//   waitOn: function () {
//     return Meteor.subscribe('pagesAll'); 
//   },
//   action: function () {
//     Session.set("DocumentTitle","Qurious");

//     // console.log(Meteor.user().services.twitter.profile_image_url);

//     this.render('Header', { to: 'header'});

//     // this.render('Nav', { to: 'nav'});

//     this.render('Explore', {
//       data: {
//         pages: function () {
//           var pages = Pages.find({  });
//           return pages;
//         },        
//       }
//     });
//   }
// });


// Router.route('/add', {
//   waitOn: function () {
    
//   },
//   action: function () {
//     // if (!Meteor.user() ) Router.go('/login'); // deny not logged in Meteor.loginWithTwitter. Doesn't seem to work because on refresh etc
//     // if (!Meteor.user() ) Meteor.loginWithTwitter();

//     this.layout('Layout');
//     Session.set("DocumentTitle","Qurious - Add Author");

//     this.render('Header', { to: 'header'});

//     // this.render('Nav', { to: 'nav'});
//     this.render('Add');
//   }
// });
