const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const messageSchema = new Schema({
	createddate:{
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
});

module.exports = mongoose.model('Message', messageSchema);
