/*
|--------------------------------------------------------------------------
| Global Functions
|--------------------------------------------------------------------------
|
| Javascript functions that can be accessed in other files
| need to be written in this style with the = sign
| otherwise they are file restricted.
|
*/



getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


toTitleCase = function (str) {
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// We wanted to have the slug as something the URL defines
slugText = function (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}