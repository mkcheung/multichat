const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Channel = mongoose.model('Channel');
const User = mongoose.model('User');
const bcrypt = require('bcrypt');  
const jwt = require("jsonwebtoken");

exports.createChannel = (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	// check to ensure that the requested users exist
	User.find({
		_id:{ $in : req.body.channelUsers  }
	}, function(err,users){
		if(!users){
			res.status(401).json({ message: 'Channel users not found' });
		} 
	});


	let usersToChannel = req.body.channelUsers;
	usersToChannel.push(userId);

	const newChannel = new Channel({
		name: req.body.channelName,
		channelUsers: usersToChannel
	})

	newChannel.save(function(err,channel){
		if(err){
			return res.status(400).send(err);
		}

		return res.json(channel);
	});
} 

exports.getUserChannels = (req, res) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	Channel.find({
		channelUsers:userId
	}, function(err,channels){
		if(!channels){
			res.status(401).json({ message: 'User has no channels' });
		} else if (channels) {
			return res.json(channels);
    	}
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
	        	res.status(401).json({ message: 'Error addng users to channel.' });
				}
				return res.json(numAff);
			});


    	}
	});
}
