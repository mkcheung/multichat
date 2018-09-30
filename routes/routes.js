'use strict';
module.exports = function(app) {
  var UserController = require('../controllers/UserController');
  var ChannelController = require('../controllers/ChannelController');
  var MessageController = require('../controllers/MessageController');

  app.route('/')
    .get(UserController.loginRequired, UserController.getAllUsers);

  app.route('/token')
    .post(UserController.login);

  app.route('/users')
    .get(UserController.loginRequired, UserController.getAllUsers)
    .post(UserController.register);

  app.route('/channel')
  	.get(UserController.loginRequired, ChannelController.getUserChannels)
  	.post(UserController.loginRequired, ChannelController.createChannel)
  	.patch(UserController.loginRequired, ChannelController.addUserToChannel);

  app.route('/channels/getChannel')
  	.get(UserController.loginRequired, ChannelController.getChannel)

  app.route('/channels/getGroupChannels')
  	.get(UserController.loginRequired, ChannelController.getGroupChannels)

  app.route('/channels/getGroupChannel')
  	.get(UserController.loginRequired, ChannelController.getGroupChannel)

  app.route('/message')
    .post(UserController.loginRequired, MessageController.createMessage);
  app.route('/messages/getMessagesInChannel')
    .get(UserController.loginRequired, MessageController.getMessagesInChannel);
  // app.route('/messages/getMessageCount')
  //   .get(UserController.loginRequired, MessageController.getMessageCount);
  app.route('/messages/resetMessageCount')
    .post(UserController.loginRequired, MessageController.resetMessageCount);

};