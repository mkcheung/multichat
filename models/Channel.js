const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const channelSchema = new Schema({
	name:{
		type:String,
		required:"Please enter a channel name.",
		unique:true
	},
	channelUsers:[
		{
			type:mongoose.Schema.ObjectId,
			required:"Please add channel participants.",
			ref:'User'
		}
	],
	messages:[
		{
			type:mongoose.Schema.ObjectId,
			ref:'Message'
		}
	],
	type:{
		type:String,
		required:"Channel type required."
	},
	created:{
		type:Date,
		default:Date.now
	},
});

function autopopulate(next){
	this.populate('messages');
	this.populate('channelUsers');
	next();
}

channelSchema.pre('find',autopopulate);
channelSchema.pre('findOne', autopopulate);
module.exports = mongoose.model('Channel', channelSchema);