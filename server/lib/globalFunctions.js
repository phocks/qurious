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