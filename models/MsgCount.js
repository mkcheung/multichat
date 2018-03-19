const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const MsgCountSchema = new Schema({
	sender:{
		type:mongoose.Schema.ObjectId,
		ref:'User'
	},
	recipient:{
		type:mongoose.Schema.ObjectId,
		ref:'User'
	},
	channel:{
		type:mongoose.Schema.ObjectId,
		ref:'Channel'
	},
	messageCount:{
		type:Number
	}
});

module.exports = mongoose.model('MsgCount', MsgCountSchema);
