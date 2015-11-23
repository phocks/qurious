// This info is for iOS and Android etc apps.

// App.accessRule('*'); allows access to other sites.
// Consider changing this to only allow Google Fonts etc as needed
App.accessRule('*');

// Overlay the background color over the status bar
// Watch out that the content doesn't bunch up.
// This was causing issues with content so disabling for now.
// App.setPreference('StatusBarOverlaysWebView', 'true');

App.setPreference('StatusBarBackgroundColor', "#fdfbf8");