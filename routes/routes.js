'use strict';
module.exports = function(app) {
  var UserController = require('../controllers/UserController');

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

};