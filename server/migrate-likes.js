/*

We needed to migrate the old liked quotes to a new system that handled when they
were liked. So this is what we used. There is a pausecomp function that 
we used so that they are not all liked at exactly the same time.

Hopefully this all works as expected.

Resurrecting this file from GitHub to try migrating likes to quote docs

*/



if (Meteor.isServer) {
  Meteor.startup(function () {
    function pausecomp(millis)
     {
      var date = new Date();
      var curDate = null;
      do { curDate = new Date(); }
      while(curDate-date < millis);
    }

    var users = Meteor.users.find().fetch();


    users.forEach(function (doc) {
      if (doc.liked) {
        doc.liked.forEach(function (quoteId) {
          // Meteor.users.update(doc._id, { $push: { dogeared: { quoteId: quoteId, dogearedAt: new Date() } } });
          Quotes.update({ _id: quoteId }, { $addToSet: { usersWhoDogeared: doc.username } });
          console.log("done " + doc.liked);
          pausecomp(100);

        });
      }
    });
    console.log('finished migrating');
  });
}