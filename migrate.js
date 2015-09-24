if (Meteor.isServer) {
    Meteor.startup(function () {
        var users = Meteor.users.find().fetch();

        users.forEach(function (doc) {
            liked.forEach(function (postId) {
                Meteor.users.update(doc._id, { $push: { liked_times: { postId: postId, likedAt: new Date() } } });
            });
        });
        console.log('finished migrating');
    });
}