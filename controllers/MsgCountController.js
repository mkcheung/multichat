const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MsgCount = mongoose.model('MsgCount');
const bcrypt = require('bcrypt');  
const jwt = require("jsonwebtoken");
const url = require('url');
var async = require('async');

exports.getAllMsgCounts = async (req, res, next) => {

	let userId = ''
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
		userId = decode._id;
		userEmail = decode.email;
	});

	let url_parts = url.parse(req.url, true);
	let queryString = url_parts.query;
	let selectedChannel = '';

	try{

		const msgCounts = await MsgCount.find({}, function(err,msgCounts){
		if(!msgCounts){
			res.status(401).json({ message: 'No msgCounts available' });
		} else if (msgCounts) {
			return res.json(msgCounts);
    	}
	});
	} catch (err){
		if(err){
				// res.status(401).json({ message: 'Error with channel message input.' });
			return next(err);
		}							
	}
} 
