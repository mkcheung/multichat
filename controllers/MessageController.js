const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Message = mongoose.model('Message');
const User = mongoose.model('User');
const Channel = mongoose.model('Channel');
const MsgCount = mongoose.model('MsgCount');
const bcrypt = require('bcrypt');  
const jwt = require("jsonwebtoken");
const url = require('url');
var async = require('async');

exports.createMessage = (req, res, next) => {

	let userId = '';
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	let selectedChannel = '';
	let currentUser = '';
	let savedMessage = '';
	let msgCountId = '';
	let msgCount = '';

	if(req.body.channelType == 'group') {
		async.series([
			function(callback){
				Channel.findOne({
					_id:req.body.channelId
				}, function(err,channel){
	                if (err){
	                	return callback(err);
	                } 

	                //Check that a user was found
	                if (!channel) {
	                    return callback(new Error('No Channel found.'));
	                }
	                selectedChannel = channel;
	                callback();
	            });
			},
			function(callback){
				User.findOne({
					_id:userId
				}, function(err,user){
	                if (err) return callback(err);
	                //Check that a user was found
	                if (!user) {
	                    return callback(new Error('No User found.'));
	                }
	                currentUser = user;
	                callback();
	            });
			},
			function(callback){
				const newMessage = new Message({
					message: req.body.message,
					user: currentUser
				});

				newMessage.save(function(err,message){
					if (err) return callback(err);
	                if (!message) {
	                    return callback(new Error('Message save unsuccessful.'));
	                }
	                savedMessage = message;
	                callback();
	            });
			},
			function(callback){	

				MsgCount.find({
					channel:req.body.channelId
				}, function(err,groupMsgCount){
	                if (err) return callback(err);
	                //Check that a user was found
	                if (!groupMsgCount) {
	                    return callback(new Error('Group Channel Message Count not found.'));
	                }

					async.forEach(groupMsgCount, function (msgCount, callback){

						let currentMsgCount = msgCount.messageCount;
						currentMsgCount++;
						
						if(msgCount.sender != userId){

							MsgCount.update({
								_id: msgCount._id
							},{
								messageCount:currentMsgCount
							}, function(err, response){
								if (err) return callback(err);
				                if (!response) {
				                    return callback(new Error('Group Channel Message Count update unsuccessful.'));
				                }
								callback();
							});
						}

					}, function(err) {
					    // if any of the file processing produced an error, err would equal that error
					    if( err ) {
					      // One of the iterations produced an error.
					      // All processing will now stop.
					      console.log('A file failed to process');
					    } else {
							console.log('All files have been processed successfully');
		        			callback();
					    }
					});
				});
			},
		], function(err, numAff, response) {
			if(err){
				// res.status(401).json({ message: 'Error with channel message input.' });
				return next(err);
			}							

			return res.json(numAff);	
		});
	} else {
		async.series([
			function(callback){
				Channel.findOne({
					_id:req.body.channelId
				}, function(err,channel){
	                if (err){
	                	return callback(err);
	                } 

	                //Check that a user was found
	                if (!channel) {
	                    return callback(new Error('No Channel found.'));
	                }
	                selectedChannel = channel;
	                callback();
	            });
			},
			function(callback){
				User.findOne({
					_id:userId
				}, function(err,user){
	                if (err) return callback(err);
	                //Check that a user was found
	                if (!user) {
	                    return callback(new Error('No User found.'));
	                }
	                currentUser = user;
	                callback();
	            });
			},
			function(callback){
				const newMessage = new Message({
					message: req.body.message,
					user: currentUser
				});

				newMessage.save(function(err,message){
					if (err) return callback(err);
	                if (!message) {
	                    return callback(new Error('Message save unsuccessful.'));
	                }
	                savedMessage = message;
	                callback();
	            });
			},
			function(callback){	
				let allChannelUsers = selectedChannel.channelUsers;

				MsgCount.find({
					channel:req.body.channelId
				}, function(err,channelMsgCounts){
	                if (err) return callback(err);
	                //Check that a user was found
	                if (!channelMsgCounts) {
	                    return callback(new Error('Channel Message Counts not found.'));
	                }

					async.forEach(channelMsgCounts, function (msgCount, callback){ 
						if(msgCount.recipient != userId){
							let numMessagesToUser = msgCount.messageCount;
							numMessagesToUser++;
						console.log(msgCount._id);
						console.log(msgCount.channel);
						console.log(msgCount.recipient);
						console.log(numMessagesToUser);

							MsgCount.update({
								_id: msgCount._id
							},{
								messageCount:numMessagesToUser
							}, function(err, response){
								if (err) return callback(err);
				                if (!response) {
				                    return callback(new Error('Channel message count update unsuccessful.'));
				                }
								callback();
							});
						}
					});
	            });
				callback();
			},
			function(callback){
				let allChannelMessages = selectedChannel.messages;
				allChannelMessages.push(savedMessage._id);
				Channel.update({
					_id: req.body.channelId
				},{
					messages:allChannelMessages
				}, function(err, response){
					if (err) return callback(err);
		            if (!response) {
		                return callback(new Error('Channel message update unsuccessful.'));
		            }
					callback();
				});
			},

		], function(err, numAff, response) {
			if(err){
				// res.status(401).json({ message: 'Error with channel message input.' });
				return next(err);
			}							

			return res.json(numAff);	
		});
	}
} 

exports.getMessagesInChannel = (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
		userId = decode._id;
		userEmail = decode.email;
	});
	
	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;
	let selectedChannel = '';

	try{

		async.series([
			function(callback){
				Channel.findOne({
					_id:queryString.channelId
					}, function(err,channel){
						if(!channel){
							res.status(401).json({ message: 'Channel messages not found' });
						} 

						// return res.json(channel.messages);
						selectedChannel = channel;
			            callback();
					});
				},
			function(callback){
				MsgCount.findOne({
					channel:selectedChannel._id,
					sender:userId
				}, function(err, msgCount){
	                if (err) return callback(err);
	                //Check that a user was found
	                if (!msgCount) {
	                    return callback(new Error('Group Channel Message Counts not found.'));
	                }

					MsgCount.update({
						channel:selectedChannel._id,
						sender:userId
					},{
						messageCount:0
					}, function(err, response){
						if (err) return callback(err);
		                if (!response) {
		                    return callback(new Error('Group Channel Message Count update unsuccessful.'));
		                }
						callback();
					});
				});
			},
		], function(err, response) {
			if(err){
				// res.status(401).json({ message: 'Error with channel message input.' });
				return next(err);
			}							
			return res.json(selectedChannel.messages);
		});
	} catch (err){
	}
} 

