// require and instantiate express
require("dotenv").config();
var express = require("express");
var app = express();
var config = require("./config");
var path = require("path");
var bodyParser = require("body-parser");
var _ = require("underscore");
var mongoose = require("mongoose");
var OAuth2Server = require("oauth2-server");
var autheticate = require("./middlewares/auth.middleware");
var OAuthAccessToken = require("./models/oauth-access-token");
var OAuthRefreshToken = require("./models/oauth-refresh-token");

app.oauth = new OAuth2Server({
	debug: true,
	model: require("./models/oauth-model") // See https://github.com/oauthjs/node-oauth2-server for specification
});
var Request = OAuth2Server.Request;
var Response = OAuth2Server.Response;

mongoose.connect(
	"mongodb://" + process.env.DB_HOST + "/" + process.env.DB_NAME,
	{
		// mongoose.connect('mongodb://' + user_name+":"+password+"@localhost/" + process.env.DB_NAME, {
		poolSize: 50,
		auto_reconnect: true,
		//socketTimeoutMS: 900000,
		socketTimeoutMS: 0,
		connectTimeoutMS: 0,
		reconnectTries: 100,
		reconnectInterval: 1000
		//connectionTimeout: 30000,
		//keepAlive: 300000
	},
	function(err) {
		let count = 0;
		if (err) {
			console.log("Err ============> ", err);
		}
	}
);
var db = mongoose.connection;
// mongoose.set("debug",true);
db.on("error", function(error) {
	console.log(error);
	//console.error.bind(console, 'error connecting with mongodb database:');
});

db.once("open", function() {
	console.log("connected to mongodb database");
});
db.on("disconnected", function() {
	//Reconnect on timeout
	//mongoose.connect('mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME);
	// mongoose.connect('mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME, {
	mongoose.connect(
		"mongodb://" + process.env.DB_HOST + "/" + process.env.DB_NAME,
		{
			server: {
				poolSize: 50,
				auto_reconnect: true,
				socketOptions: {
					//socketTimeoutMS: 900000,
					socketTimeoutMS: 0,
					connectTimeoutMS: 0,
					reconnectTries: 100,
					reconnectInterval: 1000
					//connectionTimeout: 30000,
					//keepAlive: 300000
				}
			}
		},
		function(err) {
			console.log(err);
		}
	);
	db = mongoose.connection;
});
var allowCrossDomain = function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
	res.header(
		"Access-Control-Allow-Headers",
		"Content-Type,userId,x-onehop-token,businessId,corporateId"
	);
	if (req.method == "OPTIONS") {
		res.status(200).end();
	} else {
		console.log(
			"------------------Req URL----------------- ::",
			new Date()
		);
		console.log("Req.URL :: ", req.path);
		console.log("------------------Req method-----------------");
		console.log("Req.params :: ", req.method);
		console.log("--------------------------------------------");

		next();
	}
	// next();
};
app.use(allowCrossDomain);

app.use(
	bodyParser.json({
		limit: "50mb"
	})
);
//app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		limit: "50mb",
		extended: true,
		parameterLimit: 100000000
	})
);
// tell Express to serve files from our public folder
app.use(express.static(path.join(__dirname, "public")));

app.all("/oauth/token", function(req, res, next) {
	var request = new Request(req);
	var response = new Response(res);
	app.oauth
		.token(request, response)
		.then(function(token) {
			delete token.client;
			res.status(200).send(
				JSON.stringify({
					token: token,
					status: "success"
				})
			);
		})
		.catch(function(err) {
			// console.log('inside app.js err'+err);
			console.log(err);
			return res.status(500).json(err);
		});
});

app.all("/user/*", autheticate(app, null, null));

require("./routes/user.router")(app);

var server = app.listen(process.env.PORT, function() {
	console.log("Server listening on port " + process.env.PORT);
});

module.exports = server;
