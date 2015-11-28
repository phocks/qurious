// Mobile first minimal spectacular








if (Meteor.isClient) {
  // Here we are experimenting with Dropcaps
  // This adds a span to the first letter so we can style it

  // A little trick to sense window resizing
  // Added another little hack to wait for a bit
  // to stop a million events triggering
  /* We are doing this another way now using matchMedia
  Meteor.startup(function() {
    

      function resizedw(){
          // Haven't resized in 100ms!
          Session.set("windowResizedAt", new Date());
      }

      var doit;
      window.onresize = function(){
        clearTimeout(doit);
        doit = setTimeout(resizedw, 100);
      };

      
    
  });

*/
  

  // Dropcaps for Quotes
  Template.LiteQuote.onRendered(function () {

    console.log('Inserting dropcaps span');
    var node = $("p").contents().filter(function () { return this.nodeType == 3 }).first(),
        text = node.text().trim(),
        first = text.slice(0, 1);
    
    if (!node.length) {
        console.log('not done');
        return;
      }
    
    node[0].nodeValue = text.slice(first.length);
    node.before('<span id="dropcap">' + first + '</span>');

    dropcap = document.getElementById("dropcap");
    window.Dropcap.layout(dropcap, 2, 2);    
  
  });

  // Dropcaps for Homepage text
  Template.LiteHome.onRendered(function () {
      console.log('Inserting dropcaps span');
      var node = $("p").contents().filter(function () { return this.nodeType == 3 }).first(),
          text = node.text().trim(),
          first = text.slice(0, 1);
      
      if (!node.length) {
          console.log('not done');
          return;
        }
      
      node[0].nodeValue = text.slice(first.length);
      node.before('<span id="dropcap">' + first + '</span>');

      
      dropcap = document.getElementById("dropcap");
      window.Dropcap.layout(dropcap, 2, 2);
      
  });

  // Media queries for javascript pretty much
  // Finally got it working
  var tablet = window.matchMedia("(min-width: 768px)");
  var desktop = window.matchMedia("(min-width: 992px)");
  var largeDesktop = window.matchMedia("(min-width: 1200px)");  

  var handleMediaChange = function (mediaQueryList) {
      if (mediaQueryList.matches) {
        console.log("Media query greater than triggered")
        window.Dropcap.layout(dropcap, 2, 2);
      }
      else {
        // The browser window is less than 480px wide
        console.log("Media query js smaller than triggered")
        window.Dropcap.layout(dropcap, 2, 2);
      }
  }

  tablet.addListener(handleMediaChange);
  desktop.addListener(handleMediaChange);
  largeDesktop.addListener(handleMediaChange);
  // handleMediaChange(tablet);  
  // handleMediaChange(desktop);  
  // handleMediaChange(largeDesktop);


  // Couln't get it working so got it going another way
  // screenSize = "mobile";


/*
  Tracker.autorun(function () {
    var touched = Session.get('windowResizedAt');

    // Session.set("screenSize", "mobile");

    // if above mobile set to tablet
    var mq = window.matchMedia( "(min-width: 768px)" );
    if (mq.matches) {
      // Session.set("screenSize", "tablet");
      if (screenSize != "tablet") {
        screenSize = "tablet";
        console.log(screenSize);
        return false;
      }
    }
    

    // if above tablet set to desktop
    mq = window.matchMedia( "(min-width: 922px)" );
    if (mq.matches) {
      // Session.set("screenSize", "desktop");
      if (screenSize != "desktop") {
        screenSize = "desktop";
        console.log(screenSize);
        return false;
      }
    }
    

    // if above desktop set to large-desktop
    mq = window.matchMedia( "(min-width: 1200px)" );
    if (mq.matches) {
      // Session.set("screenSize", "large-desktop");
      if (screenSize != "large-desktop") {
        screenSize = "large-desktop";
        console.log(screenSize);
        return false;
      }
    }
    else {
      screenSize = "mobile";
      console.log(screenSize);
    }

    
  });*/


} // end client only