var oauthServer = require("oauth2-server");
var Request = oauthServer.Request;
var Response = oauthServer.Response;
var _ = require("underscore");

module.exports = function(app, options) {
	var options = options || {};
	return function(req, res, next) {
		var request = new Request({
			headers: { authorization: req.headers.authorization },
			method: req.method,
			query: req.query,
			body: req.body
		});
		var response = new Response(res);

		app.oauth
			.authenticate(request, response, options)
			.then(function(token) {
				// Request is authorized.
				// console.log(token);
				// console.log(token.roles);
				if (token && token.user) {
					req.user = token.user;
					next();
				} else {
					res.json({
						status: 401,
						message: "Invalid Token"
					});
				}
			})
			.catch(function(err) {
				console.log(err);
				// Request is not authorized.
				res.status(err.code || 500).json(err);
			});
	};
};
