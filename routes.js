// This file handles all the URL routes. It uses the iron:router Meteor package.



// Let's test out an API call for use in the future
Router.route('/api', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});



/* The root home route landing for qurious.cc/   */
Router.route('/', {
  waitOn: function () {
    return Meteor.subscribe('authors');
  },
  action: function () {
    Session.set("DocumentTitle","Qurious");

    // console.log(Meteor.user().services.twitter.profile_image_url);

    this.render('Nav', { to: 'nav'});

    this.render('Home', {
      data: {
        authors: function () {
          var verifiedAuthors = Authors.find({ verified: true }, { sort: {name: 1}});
          return authors;
        },
        // authorsUnverified: function () {
        //   return Authors.find({ verified: false }, { sort: {name: 1}});
        // }
      }
    });
  }
});


Router.route('/explore', {
  waitOn: function () {
    return Meteor.subscribe('authors');
  },
  action: function () {
    Session.set("DocumentTitle","Qurious");

    // console.log(Meteor.user().services.twitter.profile_image_url);

    this.render('Nav', { to: 'nav'});

    this.render('Explore', {
      data: {
        verifiedAuthors: function () {
          var verifiedAuthors = Authors.find({ }, { sort: {name: 1}});
          return verifiedAuthors;
        },
      }
    });
  }
});


Router.route('/settings', {
  action: function () {
    Session.set("DocumentTitle","Qurious");

    
    if (!Meteor.user() ) Router.go('/sign-in');
    this.render('Nav', { to: 'nav'});
    this.render('Settings', {
      data: {
        
      }
    });
  }
});


Router.route('/add', {
  waitOn: function () {

  },
  action: function () {
    //if (!Meteor.user() ) Router.go('/login'); // deny not logged in Meteor.loginWithTwitter
    // if (!Meteor.user() ) Meteor.loginWithTwitter();

    this.layout('Layout');
    Session.set("DocumentTitle","Qurious - Add Author");

    this.render('Nav', { to: 'nav'});
    this.render('Add');
    // this.render('Nav', { to: 'nav'});
  }
});





Router.route('/faq', {
  action: function () {
    this.render('Nav', { to: 'nav'});
    this.render('Faq');
  }
});


Router.route('/sign-up', {
  waitOn: function () {

  },
  action: function () {
    if (Meteor.user() ) Router.go('/'); // deny logged in
    this.layout('Layout');
    this.render('Nav', { to: 'nav'});
    this.render('SignUp');
    // this.render('Nav', { to: 'nav'});
  }
});




Router.route('/sign-in', {
  waitOn: function () {

  },
  action: function () {
    if (Meteor.user() ) Router.go('/'); // deny logged in
    this.layout('Layout');
    Session.set("DocumentTitle","Qurious Login");

    this.render('Nav', { to: 'nav'});
    this.render('SignIn');
    // this.render('Nav', { to: 'nav'});
  }
});




// Quick and easy logouts
Router.route('/sign-out', function() {
  Meteor.logout();
  Router.go('/');
});


// How to add an author
Router.route('/:_slug/add', {
  waitOn: function () {
    return Meteor.subscribe('authors');
  },
  action: function () {
    var slug = this.params._slug;
    currentAuthor = Authors.findOne({slug: slug});
    Session.set("DocumentTitle", "Add a " + currentAuthor.name + " quotation - Qurious");
    Session.set("authorId", currentAuthor._id);

    this.render('Nav', { to: 'nav'});
    this.render('AddQuote');
    // this.render('Nav', { to: 'nav'});
  }
});


// Display the single quote you found
Router.route('/:_author_slug/:_quote_slug', {
  waitOn: function () {
    Meteor.subscribe('quotesSlug', this.params._quote_slug);
    return Meteor.subscribe('authors');
  },
  action: function () {
    var authorSlug = this.params._author_slug;
    var quoteSlug = this.params._quote_slug;
    console.log("Current quoteSlug is: " + quoteSlug );
    currentAuthor = Authors.findOne({slug: authorSlug});
    Session.set("DocumentTitle", "A quote by " + currentAuthor.name + " - Qurious");
    Session.set("authorId", currentAuthor._id);

    this.render('Nav', { to: 'nav'});
    this.render('DisplayQuote', {
      data: {
        author: function () {
          return Authors.findOne({ slug: authorSlug });
          },
        quote: function () {
          var quote = Quotes.findOne({ slug: quoteSlug });
          return quote;
        }
      }
    });
    // this.render('Nav', { to: 'nav'});
  }
});




// What quotes does the author have?
// Don't put things below this as they probs won't work
Router.route('/:_slug', {
  waitOn: function () {
    return Meteor.subscribe('authors');
  },
  action: function () {
    var slug = this.params._slug;
    var currentAuthor = Authors.findOne({slug: slug});

    if (!currentAuthor) Router.go('/');
    else {
      Session.set("DocumentTitle", currentAuthor.name + " - Qurious");
      Meteor.subscribe('quotesAuthorId', currentAuthor._id);
    }
    this.render('Nav', { to: 'nav'});
    this.render('Author', {
      data: {
        author: function () {
          return Authors.findOne({slug: slug});
          },
        quotes: function () {
          var quotes = Quotes.find( {authorId: currentAuthor._id}, { sort: {quotation: 1}} );
          return quotes;
        }
      }
    });
    // this.render('Nav', { to: 'nav'});
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