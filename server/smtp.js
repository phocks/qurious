// server/smtp.js
Meteor.startup(function () {
  process.env.MAIL_URL = 'smtp://postmaster%40sandbox71482a33e9e24b67901975719d717d59.mailgun.org:545b58d7cb61ba2ad56370b2fc87be73@smtp.mailgun.org:587';
});