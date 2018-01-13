const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Message = mongoose.model('Message');
const User = mongoose.model('User');
const Channel = mongoose.model('Channel');
const bcrypt = require('bcrypt');  
const jwt = require("jsonwebtoken");
const url = require('url');

exports.createMessage = (req, res) => {

	let userId = '';
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	// check to ensure that the requested users exist
	Channel.findOne({
		_id:req.body.channelId
	}, function(err,channel){
		if(!channel){
			res.status(401).json({ message: 'Channel not found' });
		} 

		// check to ensure that the requested users exist
		User.findOne({
			_id:userId
		}, function(err,user){
			if(!user){
				res.status(401).json({ message: 'User not found' });
			} 

			const newMessage = new Message({
				message: req.body.message,
				user: user
			});


			newMessage.save(function(err,message){
				if(err){
					return res.status(400).send(err);
				}

				let allChannelMessages = channel.messages;
				allChannelMessages.push(newMessage);

				Channel.update({
					_id: req.body.channelId
				},{
					messages:allChannelMessages
				}, function(err,numAff, response){

					if(err){
		        		res.status(401).json({ message: 'Error with channel message input.' });
					}
					return res.json(numAff);
				});
			});
		});
	});
} 

exports.getMessagesInChannel = (req, res) => {

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;

	Channel.findOne({
		_id:queryString.channelId
	}, function(err,channel){
		if(!channel){
			res.status(401).json({ message: 'Channel messages not found' });
		} 

		return res.json(channel.messages);
	});
} 

