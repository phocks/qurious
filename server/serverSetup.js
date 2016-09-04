// If we try to provide Twitter only login the following doesn't work

Accounts.emailTemplates.siteName = "Qurious";

Accounts.emailTemplates.from = "Qurious <noreply@qurious.cc>";

Accounts.emailTemplates.verifyEmail.subject = function (user) {
    return "Welcome to Qurious! Please verify your email";
};

Accounts.emailTemplates.verifyEmail.html = function (user, url) {
   return "Hi,\n\n" +
     "Please verify your email by simply clicking the link below:\n\n" +
     url;
};





// This removes the # in the url so it can be processed by iron-router
Accounts.urls.resetPassword = function(token) {
  return Meteor.absoluteUrl('password-reset/' + token);
  //return 'https://qurious.cc/password-reset/' + token;
};