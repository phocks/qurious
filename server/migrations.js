/*

We will use this file for migrations on the database

We needed to migrate the old liked quotes to a new system that handled when they
were liked. So this is what we used. There is a pausecomp function that 
we used so that they are not all liked at exactly the same time.

Hopefully this all works as expected.

Resurrecting this file from GitHub to try migrating likes to quote docs

*/


// Commenting out as only needed once. Good job!


// if (Meteor.isServer) {
//   Meteor.startup(function () {
//     function pausecomp(millis)
//      {
//       var date = new Date();
//       var curDate = null;
//       do { curDate = new Date(); }
//       while(curDate-date < millis);
//     }

//     var users = Meteor.users.find().fetch();


//     users.forEach(function (doc) {
//       if (doc.liked) {
//         doc.liked.forEach(function (quoteId) {
//           // Meteor.users.update(doc._id, { $push: { dogeared: { quoteId: quoteId, dogearedAt: new Date() } } });
//           Quotes.update({ _id: quoteId }, { $addToSet: { usersWhoDogeared: doc.username } });
//           console.log("done " + doc.liked);
//           pausecomp(100);

//         });
//       }
//     });
//     console.log('finished migrating');
//   });
// }



// This was a migration to create slugs on all the quotes and it seemed to work

// if (Meteor.isServer) {
//   Meteor.startup(function () {
//     function pausecomp(millis)
//      {
//       var date = new Date();
//       var curDate = null;
//       do { curDate = new Date(); }
//       while(curDate-date < millis);
//     }

//     var quotes = Quotes.find().fetch();


//     quotes.forEach(function (doc) {
//       if (!doc.slug) {
//         console.log(doc.quotation);

//         var n = 5;
//         var shortenedText = doc.quotation.replace(/\s+/g," ").split(/(?=\s)/gi).slice(0, n).join('');
//         shortenedText = shortenedText.replace(/[^a-zA-Z\d\s]/g, ""); // remove special chars as well

//         var quoteSlug = slugify(shortenedText);

//         Quotes.update( { _id: doc._id }, { $set: { slug: quoteSlug }} );

//       }
//     });
//     console.log('Finished migrating quotes.');
//   });
// }