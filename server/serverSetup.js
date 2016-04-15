Accounts.emailTemplates.siteName = "Qurious";

Accounts.emailTemplates.from = "Qurious Admin <jb@qurious.cc>";

Accounts.emailTemplates.verifyEmail.subject = function (user) {
    return "Welcome to Qurious! Please verify your email";
};

Accounts.emailTemplates.verifyEmail.html = function (user, url) {
   return "Hi,\n\n" +
     "Please verify your email by simply clicking the link below:\n\n" +
     url;
};