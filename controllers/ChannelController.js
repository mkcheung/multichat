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

exports.getChannel = (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
			userEmail = decode.email;
		});

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;
	Channel.findOne(
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
	}, function(err,channel){

		let newChannel = '';
		let msgCountSaved1 = '';
		let msgCountSaved2 = '';
		let allChannelUserMessageCount = [];

		if(!channel){
			
			let directedUser = User.findOne({
				_id:req.body.message_user_ids
			});

			let usersToChannel = [userId,queryString.message_user_ids];


			async.series([
				function(callback){
					const newChannelInDevelopment = new Channel({
						name: userEmail+' To '+queryString.channelName,
						channelUsers: usersToChannel,
						type:"oneOnOne"
					});
					newChannelInDevelopment.save(function(err,channel){
						if(err){
							return res.status(400).send(err);
						}
						Channel.populate(channel, { path: 'channelUsers'}, function (err, channel) {
							newChannel = channel
                			callback();
						});
					});
				},
				function(callback){
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

					msgCount.save(function(err, msgCount){
						if(err){
							return res.status(400).send(err);
						}
						allChannelUserMessageCount.push(msgCount._id);

						msgCountSaved1 = msgCount;

						msgCount2.save(function(err2, msgCount2){
							if(err2){
								return res.status(400).send(err2);
							}
							allChannelUserMessageCount.push(msgCount2._id);
							msgCountSaved2 = msgCount2;

                			callback();
                		});
					});
				},
				function(callback){
					Channel.update({
						_id: newChannel._id
					},{
						userMsgCount:allChannelUserMessageCount
					}, function(err, response){
						if (err) return callback(err);
		                if (!response) {
		                    return callback(new Error('Channel message count update unsuccessful.'));
		                }

		                let userMsgCountToSave = [msgCountSaved1._id]
						User.update({
							_id: userId
						},{
							userMsgCount: userMsgCountToSave
						}, function(userErr, userresponse){

							if (userErr) return callback(userErr);
			                if (!userresponse) {
			                    return callback(new Error('Channel message count update unsuccessful.'));
			                }

		                	let userMsgCountToSave2 = [msgCountSaved2._id]

							User.update({
								_id: queryString.message_user_ids
							},{
								userMsgCount: userMsgCountToSave2
							}, function(userErr2, userresponse2){

								if (userErr2) return callback(userErr2);
				                if (!userresponse2) {
				                    return callback(new Error('Channel message count update unsuccessful.'));
				                }
                				callback();
                			});
						});
					});
				},
			], function(err, response) {
				if(err){
					// res.status(401).json({ message: 'Error with channel message input.' });
					return next(err);
				}							
				return res.json(newChannel);
			});


		} else if (channel) {
			MsgCount.find({
				channel:channel._id,
				sender: userId,
				recipient: queryString.message_user_ids
			}, function(err, msgCountFromSender){
                if (err) return callback(err);

				MsgCount.update({
					_id: msgCountFromSender[0]._id
				},{
					messageCount:0
				}, function(err, response){
					if (err) return callback(err);
	                if (!response) {
	                    return callback(new Error('Channel message count update unsuccessful.'));
	                }
					return res.json(channel);
				});

            });

    	}
	});
}

exports.getGroupChannel = (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
		userId = decode._id;
		userEmail = decode.email;
	});

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;

	Channel.findOne(
	{ 
		'$and': 
		[ 
			{
				_id: queryString.groupChannelId,
				type:'group'  
			}
		] 
	}
	, function(err,channel){
		if(!channel){
			return res.status(401).send("Group channel not found.");
		} 
		return res.json(channel);
	});
}

exports.addUserToChannel = (req, res) => {


	Channel.findOne({
		_id:req.body.channelId
	}, function(err,channel){
		if(!channel){
			res.status(401).json({ message: 'Channel not found' });
		} else if (channel) {

			// check to ensure that the requested users exist
			User.find({
				_id:{ $in : req.body.userIds  }
			}, function(err,users){
				if(!users){
					res.status(401).json({ message: 'Channel users not found' });
				} 
			});

			let newUsers = channel.channelUsers;
			newUsers.push(req.body.userIds);

			Channel.update({
				_id: req.body.channelId
			},{
				channelUsers:newUsers
			}, function(err,numAff, response){

				if(err){
	        		res.status(401).json({ message: 'Error adding users to channel.' });
				}
				return res.json(numAff);
			});


    	}
	});
}
