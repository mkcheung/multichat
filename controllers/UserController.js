const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcrypt');  
const promisify = require('es6-promisify');
const jwt = require("jsonwebtoken");

exports.getAllUsers = (req, res) => {

	let userId = '';
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			userId = decode._id;
		});

	User.find({"_id":{$ne: userId }}, function(err,users){
		if(!users){
			res.status(401).json({ message: 'No users.' });
		} else if (users) {
			return res.json(users);
    	}
	});
}

exports.register = (req, res) => {
	let hashedPw = bcrypt.hashSync(req.body.password, 10);

	const newUser = new User({
		email:req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		hashPassword: hashedPw
	});

	newUser.save(function(err, user) {
	    if (err){
	      return res.status(400).send(err);
	    }

	    return res.json(user);
	  });
}

exports.login = function(req, res){

	let authFailedMsg = 'Bad credentials. User not found.';

	User.findOne({
		email:req.body.email
	}, function(err,user){
		if(!user){
			res.status(401).json({ message: authFailedMsg });
		} else if (user) {

			if (!user.comparePassword(req.body.password)) {
	        	res.status(401).json({ message: authFailedMsg });
			} else {
				return res.json({token: jwt.sign({ email: user.email, fullName: user.firstName + ' ' + user.lastName, _id: user._id}, 'RESTFULAPIs')});
			}
    	}
	});
}
exports.loginRequired = function(req, res, next){
	if(req.user){
		next();
	} else {
		return res.status(401).json({message: 'Please log in.'});
	}
}