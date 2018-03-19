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
			let allChannelUserMessageCount = selectedChannel.userMsgCount;
			if( allChannelUserMessageCount.length == 0 ){

				async.each(allChannelUsers, function (user, callback){ 
					if(user._id != userId){
						let msgCount = new MsgCount({
							sender: userId,
							recipient: user._id,
							channel: selectedChannel._id,
							messageCount:1
						});

						msgCount.save(function(err, msgCount){
							if(err){
								return res.status(400).send(err);
							}
							msgCountId = msgCount._id;

							allChannelUserMessageCount.push(msgCountId);

							Channel.update({
								_id: req.body.channelId
							},{
								userMsgCount:allChannelUserMessageCount
							}, function(err, response){
								if (err) return callback(err);
				                if (!response) {
				                    return callback(new Error('Channel message count update unsuccessful.'));
				                }

				                let currUserMsgCount = user.userMsgCount;
								currUserMsgCount.push(msgCountId);
								User.update({
									_id: currentUser._id
								},{
									userMsgCount: currUserMsgCount
								}, function(userErr, userresponse){

									if (userErr) return callback(userErr);
					                if (!userresponse) {
					                    return callback(new Error('Channel message count update unsuccessful.'));
					                }
									callback();
								});

							});
						});
					}
				});
			} else {

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
			}
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

exports.getMessagesInChannel = (req, res) => {

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;
	try{

		Channel.findOne({
			_id:queryString.channelId
		}, function(err,channel){
			if(!channel){
				res.status(401).json({ message: 'Channel messages not found' });
			} 

			return res.json(channel.messages);
		});
	} catch (err){
	}
} 

