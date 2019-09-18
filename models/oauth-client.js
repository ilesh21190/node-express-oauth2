"use strict";
var mongoose = require("mongoose"),
	Schema = mongoose.Schema;

var OAuthClientSchema = new Schema({
	name: String,
	client_id: String,
	client_secret: String,
	redirect_uri: String,
	grants: [String],
	scope: String,
	refreshTokenLifetime: Number,
	accessTokenLifetime: Number,
	user: { type: Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("OAuthClient", OAuthClientSchema);
