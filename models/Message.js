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
	}
});


function autopopulate(next){
	this.populate('user');
	next();
}

messageSchema.pre('find',autopopulate);
messageSchema.pre('findOne', autopopulate);
module.exports = mongoose.model('Message', messageSchema);
