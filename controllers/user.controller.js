var express = require("express");
var User = require("../models/user.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;
function welcome(req, res) {
	console.log("Welcome to project");
	res.send({ message: "Welcome" });
}
exports.welcome = welcome;

function saveUser(req, res) {
	var user = new User(req.body);
	user.type = "student";
	bcrypt.hash(user.password, saltRounds, function(err, hash) {
		user.password = hash;
		user.save()
			.then(user => {
				console.log(user);
				res.send({ user });
			})
			.catch(error => {
				console.log(error);
				res.status(403).send({ error: error });
			});
	});
}

exports.saveUser = saveUser;

function getAllUsers(req, res) {
	console.log("user", req.user);
	User.find({}, { password: 0 })
		.then(data => {
			res.send(data);
		})
		.catch(error => {
			console.log(error);
			res.status(403).send({ error: error });
		});
}

exports.getAllUsers = getAllUsers;
