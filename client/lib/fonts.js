// Font experiment to see if we can load fonts on demand
  // and YES it looks like we can.
  if (true) {  // We are enabling this now, as dropcap.js doesn't work well with @import CSS
    WebFontConfig = {
      google: { families: [ 'Vollkorn:400,400italic:latin' ] }
    };
    (function() {
      var wf = document.createElement('script');
      wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
      wf.type = 'text/javascript';
      wf.async = 'true';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(wf, s);
    })();
  }