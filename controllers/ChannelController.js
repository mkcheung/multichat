const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Channel = mongoose.model('Channel');
const bcrypt = require('bcrypt');  
const jwt = require("jsonwebtoken");

exports.createChannel = (req, res) => {

	const newChannel = new Channel({
		name: req.body.channelName,
		channelUsers: req.body.channelUsers
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