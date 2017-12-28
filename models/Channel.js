const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const channelSchema = new Schema({
	name:{
		type:String,
		required:"Please enter a channel name.",
		unique:true
	}
});

module.exports = mongoose.model('Channel', channelSchema);