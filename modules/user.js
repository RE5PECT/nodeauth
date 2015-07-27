var mongoose = require('mongoose');
var db = mongoose.connection;
var bcrypt = require('bcrypt-nodejs');

mongoose.connect('mongodb://localhost/nodeauth');

// User Schema
var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index: true
	},
	password:{
		type: String,
		required: true,
		bcrypt: true
	},
	email: {
		type: String
	},
	name: {
		type: String
	},
	profileimage: {
		type: String
	}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.hash(newUser.password, null, null, function(err, hash){
		if(err) throw err;
		// Set Hashed pw
		newUser.password = hash;
	});
	newUser.save(callback);	
};

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
};

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
};
module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch){
		if (err) return callback(err);
		callback(null, isMatch);
	})
};