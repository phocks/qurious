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


function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}