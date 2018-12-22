const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcrypt');  
const promisify = require('es6-promisify');
const jwt = require("jsonwebtoken");

exports.getAllUsers = async (req, res) => {

	let userId = '';
	jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode){
			if(err){
				return res.status(401).json({ message: 'Authorization required.' });
			}

			userId = decode._id;
		});

	try {

		const users = await User.find({});
		if(!users){
			res.status(401).json({ message: 'No users.' });
		} else {
			return res.json(users);
		}
	} catch (error) {
		return res.status(400).send(error);
	}
}

exports.register = async (req, res) => {
	let hashedPw = bcrypt.hashSync(req.body.password, 10);

	const newUser = new User({
		email:req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		loggedIn: false,
		hashPassword: hashedPw
	});
	try {

		const newUserResult = await newUser.save();
		return res.json(newUserResult);
	} catch (error) {
		return res.status(400).send(error);
	}
}

exports.login = async (req, res) => {

	let authFailedMsg = 'Bad credentials. User not found.';

	try {

		const userToLogIn = await User.findOne({ email:req.body.email });
		if(!userToLogIn){
			return res.status(401).json({ message: authFailedMsg });
		}

		if ( !(await userToLogIn.comparePassword(req.body.password))) {
        	return res.status(401).json({ message: authFailedMsg });
		} else {
			return res.json({userid:userToLogIn._id ,token: jwt.sign({ email: userToLogIn.email, fullName: userToLogIn.firstName + ' ' + userToLogIn.lastName, _id: userToLogIn._id}, 'RESTFULAPIs')});
		}

	} catch (error) {
		return res.status(400).send(error);
	}
}
exports.loginRequired = function(req, res, next){
	if(req.user){
		next();
	} else {
		return res.status(401).json({message: 'Please log in.'});
	}
}