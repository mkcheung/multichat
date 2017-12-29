const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const messageSchema = new Schema({
	created:{
		type:Date,
		default:Date.now
	},
	message:{
		type:String
	},
	user:{
		type:mongoose.Schema.ObjectId,
		ref:'User'
	},
	channel:{
		type:mongoose.Schema.ObjectId,
		ref:'Channel'
	}
});

module.exports = mongoose.model('Message', messageSchema);
