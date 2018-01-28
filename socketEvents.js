

require('./models/User'); 
const mongoose = require('mongoose');
const User = mongoose.model('User');

exports = module.exports = function (io) {
  // Set socket.io listeners.
  io.on('connection', (socket) => {
    // console.log(io.sockets);


    socket.on('loggedIn', (userId) => {
      let loggedInUserId = userId;
      let currentUser = User.findById(loggedInUserId, function(err,user){
        if(err){
          // res.status(401).json({ message: 'No users.' });
        } 
        user.loggedIn = true;
        user.save(function (err, updatedUser) {
          if (err) return handleError(err);
            
          let activeUsers = User.find({}, function(err,activeUsers){
            if(err){
              // res.status(401).json({ message: 'No users.' });
            } 
            io.emit('refresh users', activeUsers);
          });
        });
      });

    });

    socket.on('loggedOut', (userId) => {
      let loggedOutUserId = userId;
      let currentUser = User.findById(loggedOutUserId, function(err,user){
        if(err){
          // res.status(401).json({ message: 'No users.' });
        } 
        user.loggedIn = false;
        user.save(function (err, updatedUser) {
        if (err) return handleError(err);
          let activeUsers = User.find({}, function(err,activeUsers){
            if(err){
              // res.status(401).json({ message: 'No users.' });
            } 
            io.emit('refresh users', activeUsers);
          });
        });
      });

    });
    // On conversation entry, join broadcast channel
    socket.on('enter conversation', (conversation) => {
      socket.join(conversation);
      console.log('joined ' + conversation);
    });

    socket.on('leave conversation', (conversation) => {
      socket.leave(conversation);
      console.log('left ' + conversation);
    });

    socket.on('new message', (conversation) => {
      console.log('new message ' + conversation);
      io.sockets.in(conversation).emit('refresh messages', conversation);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
};