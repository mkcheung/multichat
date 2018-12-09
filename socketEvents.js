

require('./models/User'); 
require('./models/Channel'); 
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Channel = mongoose.model('Channel');

exports = module.exports = function (io) {
  // Set socket.io listeners.
  io.on('connection', (socket) => {
    
    console.log("New client connected", socket.id);
    console.log(' %s sockets connected', io.engine.clientsCount);

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

    socket.on('logged out', (userId) => {
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

    socket.on('new message', (conversation, senderId) => {
      io.sockets.in(conversation).emit('refresh messages', conversation, senderId);
      // io.sockets.in(conversation).emit('refresh msgCount', conversation, senderId);
      let currentChannel = Channel.findById(conversation, function(err,channel){
          if(err){
            console.log('error');
            // res.status(401).json({ message: 'No users.' });
          } 
          let userIdsInChannel = new Array();
          const channelUsers = channel.channelUsers;
          for (let i=0 ; i < channelUsers.length; i++){
            if(senderId != channelUsers[i]._id){
              userIdsInChannel.push(channelUsers[i]._id);
            }
          }

          let activeUsers = User.find({}, function(err,activeUsers){
            if(err){
              // res.status(401).json({ message: 'No users.' });
            } 
            // console.log(activeUsers[2].userMsgCount[0].messageCount);
            // for ( var key in activeUsers){
            //   console.log(activeUsers[key].userMsgCount);
            // }
            io.emit('refresh users', activeUsers);
            io.emit('signal message', userIdsInChannel, senderId);
          });

      });
    });

    socket.on('new group', () => {
      io.emit('refresh groups');
    });

    socket.on('reset Users', () => {
      let activeUsers = User.find({}, function(err,activeUsers){
        if(err){
          // res.status(401).json({ message: 'No users.' });
        } 
        console.log('reset users called');
        io.emit('refresh users', activeUsers);
      });
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      console.log("disconnect: ", socket.id);
    });
  });
};