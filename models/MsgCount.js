const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const MsgCountSchema = new Schema({
	user:{
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

function autopopulate(next){
	this.populate('user');
	this.populate('channel');
	next();
}

MsgCountSchema.pre('find',autopopulate);
MsgCountSchema.pre('findOne', autopopulate);
module.exports = mongoose.model('MsgCount', MsgCountSchema);
