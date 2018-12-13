const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Channel = mongoose.model('Channel');
const User = mongoose.model('User');
const MsgCount = mongoose.model('MsgCount');
const bcrypt = require('bcrypt');  
const jwt = require("jsonwebtoken");
const url = require('url');
var async = require('async');

exports.createChannel = async (req, res) => {

	let userId = '';
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	let allChannelUserMessageCount = [];
	let usersToChannel = req.body.channelUsers;
	usersToChannel.push(userId);

	const userDataSet = await User.find({
		_id:{ $in : req.body.channelUsers  }
	});
    if (!userDataSet) {
		res.status(401).json({ message: 'Channel users not found.' });
    }

	const newChannel = new Channel({
		name: req.body.channelName,
		channelUsers: usersToChannel,
		type:req.body.type
	});

	const createdGroupChannel = await newChannel.save();

	if(!createdGroupChannel){
		throw new Error('Could not create channel.');
	}

	async.series([
		function(callback){	
			async.forEach(usersToChannel, async function (user, callback){


				let msgCount = new MsgCount({
					sender: user,
					channel: createdGroupChannel._id,
					messageCount:0
				});

				msgCount.save(function(msgCountErr, msgCount){
					if(msgCountErr){
						return res.status(400).send(msgCountErr);
					}
					allChannelUserMessageCount.push(msgCount._id);
                	callback();
				});

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
	});


	const chanUpdRes = Channel.update({
		_id: createdGroupChannel._id
	},{
		userMsgCount:allChannelUserMessageCount
	});

	if(!chanUpdRes){
		throw new Error('Count not update channel');
	}
	return res.json(createdGroupChannel);	
} 

exports.getUserChannels = async (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	const channelData = await Channel.find({
		channelUsers:userId
	});
	if(!channelData){
		res.status(401).json({ message: 'User has no channels' });
	} else if (channelData) {
		return res.json(channelData.data);
	}

	// Channel.find({
	// 	channelUsers:userId
	// }, function(err,channels){
	// 	if(!channels){
	// 		res.status(401).json({ message: 'User has no channels' });
	// 	} else if (channels) {
	// 		return res.json(channels);
 //    	}
	// });
}

exports.getGroupChannels = async (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	const channelData = await Channel.find({ 
		'$and': 
		[ 
			{
				channelUsers: {
					"$in" : [userId]
				},
				type:'group'  
			}
		] 
	});
	if(!channelData){
		res.status(401).json({ message: 'No group channels' });
	} else if (channelData) {
		return res.json(channelData);
	}
}

exports.getChannel = async (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
			userEmail = decode.email;
		});

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;	
	let allChannelUserMessageCount = [];

	try {

		const channel = await Channel.findOne(
		{ 
			'$and': 
		    [ 
				{ 
					channelUsers: {
						"$size" : 2,
						"$all" : [userId,queryString.message_user_ids]
					},
					type:'oneOnOne' 
				} 
		    ] 
		});

	    if (!channel) {
			
			let directedUser = await User.findOne({
				_id:req.body.message_user_ids
			});

			let usersToChannel = [userId,queryString.message_user_ids];

			const newChannelInDevelopment = new Channel({
				name: userEmail+' To '+queryString.channelName,
				channelUsers: usersToChannel,
				type:"oneOnOne"
			});

			const channel = await newChannelInDevelopment.save();

	    	if (!channel) {
	    		throw new Error('Could not create new channel');
	    	}

			const newChannel = await Channel.populate(channel, { path: 'channelUsers' });

			let msgCount = new MsgCount({
				sender: userId,
				recipient: queryString.message_user_ids,
				channel: newChannel._id,
				messageCount:0
			});

			let msgCount2 = new MsgCount({
				sender: queryString.message_user_ids,
				recipient: userId,
				channel: newChannel._id,
				messageCount:0
			});


			const msgCountSaved1 = await msgCount.save(); 
			allChannelUserMessageCount.push(msgCount._id);

	    	if (!msgCountSaved1) {
	    		throw new Error('Could not create new msgCount');
	    	}
			
			const msgCountSaved2 = await msgCount2.save(); 
			allChannelUserMessageCount.push(msgCount2._id);

	    	if (!msgCountSaved2) {
	    		throw new Error('Could not create new msgCount');
	    	}

	    	const newChannelUpdateRes = await Channel.update({
											_id: newChannel._id
										},{
											userMsgCount:allChannelUserMessageCount
										});

            if (!newChannelUpdateRes) {
                return callback(new Error('Channel message count update unsuccessful.'));
            }

            let userMsgCountToSave = [msgCountSaved1._id]
			const userUpdateRes1 = await User.update({
										_id: userId
									},{
										userMsgCount: userMsgCountToSave
									});

            if (!userUpdateRes1) {
                return callback(new Error('Channel message count update unsuccessful.'));
            }

        	let userMsgCountToSave2 = [msgCountSaved2._id]

			const userUpdateRes2 = await User.update({
										_id: queryString.message_user_ids
									},{
										userMsgCount: userMsgCountToSave2
									});

            if (!userUpdateRes2) {
                return callback(new Error('Channel message count update unsuccessful.'));
            }

			return res.json(newChannel);

		} else if (channel) {

			const msgCountFromSender = await MsgCount.find({
				channel:channel._id,
				sender: userId,
				recipient: queryString.message_user_ids
			});

            if (!msgCountFromSender) {
                throw new Error('MsgCount not found.');
            }

			const msgCountUpdateRes = MsgCount.update({
											_id: msgCountFromSender[0]._id
										},{
											messageCount:0
										});
            if (!msgCountUpdateRes) {
                throw new Error('Channel message count update unsuccessful.');
            }
			return res.json(channel);
    	}
	} catch (error) {
		console.log(error);
		return next(error);
	}
}

exports.getGroupChannel = async (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
		userId = decode._id;
		userEmail = decode.email;
	});

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;

	const channel = await Channel.findOne(
					{ 
						'$and': 
						[ 
							{
								_id: queryString.groupChannelId,
								type:'group'  
							}
						] 
					});
	if(!channel){
		return res.status(401).send("Group channel not found.");
	} 
	return res.json(channel);
}

exports.addUserToChannel = async (req, res) => {

	const channel = await Channel.findOne(
					{ 
						_id:req.body.channelId
					});
	try{
		if(!channel){
			res.status(401).json({ message: 'Channel not found' });
		} else if (channel) {

			// check to ensure that the requested users exist
			const users = await User.find({
				_id:{ $in : req.body.userIds  }
			});

			if(!users){
				res.status(401).json({ message: 'Channel users not found' });
			} 

			let newUsers = channel.channelUsers;
			newUsers.push(req.body.userIds);

			const channelUpdateResults = await Channel.update({
				_id: req.body.channelId
			},{
				channelUsers:newUsers
			});

			return res.json(channelUpdateResults);
		}
	} catch (error) {
		res.status(401).json({ message: 'Error adding users to channel.' });
	}
}
