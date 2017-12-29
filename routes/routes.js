'use strict';
module.exports = function(app) {
  var UserController = require('../controllers/UserController');

  var ChannelController = require('../controllers/ChannelController');

  // User Routes
  app.route('/')
    .get(UserController.loginRequired, UserController.testing);


  // Token
  app.route('/token')
    .post(UserController.login);

  // User Routes
  app.route('/users')
    .get(UserController.loginRequired, UserController.testing)
    .post(UserController.register);

  app.route('/channel')
  	.get(UserController.loginRequired, ChannelController.getUserChannels)
  	.post(UserController.loginRequired, ChannelController.createChannel)
  	.patch(UserController.loginRequired, ChannelController.addUserToChannel);

};