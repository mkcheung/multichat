const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const validator = require('validator');

const userSchema = new Schema({
	email:{
		type: String,
		unique: true,
		lowercase: true,
		trim:true,
		validate: [validator.isEmail, 'Invalid Email Address'],
		required: 'Please supply an email address'
	},
	firstName:{
		type: String,
		trim:true,
		required: 'Please supply a first name'
	},
	lastName:{
		type: String, 
		trim:true,
		required: 'Please supply a last name'
	},
	hashPassword:{
		type:String,
		required:true
	},
	created: {
		type:Date,
		default:Date.now
	}
	resetPasswordToken: String,
	resetPasswordExpires: Date,
});
userSchema.methods.comparePassword = function(password) {
	return bcrypt.compareSync(password,this.hashPassword);
};

module.exports = mongoose.model('User', userSchema);