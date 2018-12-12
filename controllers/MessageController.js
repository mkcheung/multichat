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

exports.createMessage = async(req, res, next) => {

	let userId = '';
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	let selectedChannel = '';
	let currentUser = '';
	let savedMessage = '';
	let msgCountId = '';
	let msgCount = '';
	let msgCount_1on1 = '';

	if(req.body.channelType == 'group') {


		try {

			const selectedChannel = await Channel.findOne({ _id:req.body.channelId });

            if (!selectedChannel) {
                throw new Error('No Channel found.');
            }

			const currentUser = await User.findOne({ _id:userId });

            if (!currentUser) {
                throw new Error('No User found.');
            }

			const newMessage = new Message({
				message: req.body.message,
				user: currentUser
			});

			const savedMessage = await newMessage.save();

			const groupMsgCountResp = await MsgCount.find({
				channel:req.body.channelId
			});
            if (!groupMsgCountResp) {
                throw new Error('Group Channel Message Count not found.');
            }

            const groupMsgCount = groupMsgCountResp.data;

			async.series([
				function(callback){	
					async.forEach(groupMsgCount, async function (msgCount, callback){

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
					callback();
				}
			], function(err, numAff, response) {
				if(err){
					// res.status(401).json({ message: 'Error with channel message input.' });
					return next(err);
				}							
				return res.json(numAff);	
			});
		} catch(error) {
            console.log(error);
		}
	} else {

		try {

			const selectedChannel = await Channel.findOne({ _id:req.body.channelId });

            if (!selectedChannel) {
                throw new Error('No Channel found.');
            }

			const currentUser = await User.findOne({ _id:userId });

            if (!currentUser) {
                throw new Error('No User found.');
            }

			const newMessage = new Message({
				message: req.body.message,
				user: currentUser
			});

			const savedMessage = await newMessage.save();

			let allChannelMessages = selectedChannel.messages;
			allChannelMessages.push(savedMessage._id);

			const channelUpdateResp = await Channel.update({
				_id: req.body.channelId
			},{
				messages:allChannelMessages
			});

            if (!channelUpdateResp) {
                throw new Error('Channel message update unsuccessful.');
            }

			const msgCount_1on1 = await MsgCount.findOne({
				channel:req.body.channelId,
				sender:userId
			});
            if (!msgCount_1on1) {
                throw new Error('No oneOnOne MsgCount found.');
            }

			let numMessagesToUser = msgCount_1on1.messageCount;
			numMessagesToUser++;

			const msgCountUpdateResp = await MsgCount.update({
				_id: msgCount_1on1._id
			},{
				messageCount:numMessagesToUser
			});

            if (!msgCountUpdateResp) {
                throw new Error('Channel message count update unsuccessful.');
            }
			return res.json();

		} catch(error) {
            console.log(error);
		}
	}
} 

exports.getMessagesInChannel = async (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
		userId = decode._id;
		userEmail = decode.email;
	});

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;
	let selectedChannel = '';

	try{

		const selectedChannel = await Channel.findOne({ _id:queryString.channelId });

		if(!selectedChannel){
			res.status(401).json({ message: 'Channel messages not found' });
		} 
		return res.json(selectedChannel.messages);

	} catch (err){
		console.error(err);
		console.log(err);
	}
} 



exports.resetMessageCount = (req, res) => {

	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
			userEmail = decode.email;
		});


	if(req.body.msgCountId){
		MsgCount.findOne({
			_id:req.body.msgCountId
		}, function(err,msgCount){
			if(!msgCount){
				res.status(401).json({ message: 'MsgCount not found' });
			} else if (msgCount) {

				MsgCount.update({
					_id: req.body.msgCountId
				},{
					messageCount:0
				}, function(err, response){
					if(err){
		        		res.status(401).json({ message: 'Error resetting message count.' });
					}
					return res.json(response);
				});
	    	}
		});
	} else if (req.body.channelId && req.body.recipientId){
		console.log(req.body.channelId);
		console.log(req.body.recipientId);
		MsgCount.findOne({
			channel:req.body.channelId,
			recipient:req.body.recipientId
		}, function(err,msgCount){
			if(!msgCount){
				res.status(401).json({ message: 'MsgCount not found' });
			} else if (msgCount) {

				MsgCount.update({
					channel:req.body.channelId,
					recipient:req.body.recipientId
				},{
					messageCount:0
				}, function(err, response){
					if(err){
		        		res.status(401).json({ message: 'Error resetting message count.' });
					}
					return res.json(response);
				});
	    	}
		});
	}

}

