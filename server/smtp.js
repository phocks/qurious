// server/smtp.js
Meteor.startup(function () {
  process.env.MAIL_URL = Meteor.settings.mailGunUrl;
});