Router.route('/:_author_slug', {
  loadingTemplate: 'LiteLoad',
  waitOn: function () {
    
  },
  action: function () {
    this.layout('LiteLayout');
    this.render('LiteHeader', { to: 'header'});
    this.render('Author');
    // this.render('LiteFooter', { to: 'footer'});
  },
});