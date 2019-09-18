var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var User = new Schema({
	name: String,
	email: String,
	password: String,
	type: String // employee, student etc
});

User.pre("save", function(next) {
	now = new Date().getTime();
	this.updatedAt = now;
	if (!this.createdAt) {
		this.createdAt = now;
	}
	next();
});

User.pre("update", function() {
	this.update({}, { $set: { updatedAt: new Date().getTime() } });
});

var UserModel = mongoose.model("User", User);

module.exports = UserModel;
