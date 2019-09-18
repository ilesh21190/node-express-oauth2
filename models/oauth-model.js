var _ = require("lodash");

var OAuthClient = require("./oauth-client");
var OAuthAccessToken = require("./oauth-access-token");
var OAuthAuthorizationCode = require("./oauth-authorization-code");
var OAuthRefreshToken = require("./oauth-refresh-token");
var User = require("./user.model");
var bcrypt = require('bcrypt')
function getAccessToken(bearerToken) {
	// console.log("getAccessToken",bearerToken)
	return (
		OAuthAccessToken
			//User,OAuthClient
			.findOne({ access_token: bearerToken })
			.populate("user")
			.populate("OAuthClient")
			.then(function(accessToken) {
				// console.log('at',accessToken)

				if (!accessToken) return false;
				var token = accessToken;
				token.accessTokenExpiresAt = token.expires;
				token.user = accessToken.user;
				return token;
			})
			.catch(function(err) {
				console.log("getAccessToken - Err: " + err);
			})
	);
}

function getClient(clientId, clientSecret) {
	// console.log("getClient",clientId, clientSecret)
	const options = { client_id: clientId };
	if (clientSecret) options.client_secret = clientSecret;

	return OAuthClient.findOne(options)
		.then(function(client) {
			if (!client) return new Error("client not found");
			var clientWithGrants = client;
			clientWithGrants.grants = [
				"authorization_code",
				"password",
				"refresh_token",
				"client_credentials"
			];
			// Todo: need to create another table for redirect URIs
			clientWithGrants.redirectUris = [clientWithGrants.redirect_uri];
			delete clientWithGrants.redirect_uri;
			clientWithGrants.refreshTokenLifetime = client.refreshTokenLifetime;
			clientWithGrants.accessTokenLifetime = client.accessTokenLifetime;
			return clientWithGrants;
		})
		.catch(function(err) {
			console.log("getClient - Err: ", err);
		});
}

function getUser(username, password) {
	console.log('user ..'+username);

	return User.findOne({
		email: username
	})
		.then(function(user) {
			console.log('user ..'+username,user);

			if (user) {
				console.log(password,user.password,bcrypt.compareSync(password, user.password));
				if (bcrypt.compareSync(password, user.password)) {
					
					delete user.password;
					return user;
				} else {
					return false;
				}
			} else {
				console.log('seriouslly111')
				return false;
			}
		})
		.catch(error => {
			console.log(error);
			return false;
		});
}

function revokeAuthorizationCode(code) {
	// console.log("revokeAuthorizationCode",code)
	return OAuthAuthorizationCode.findOne({
		where: {
			authorization_code: code.code
		}
	})
		.then(function(rCode) {
			//if(rCode) rCode.destroy();
			/***
			 * As per the discussion we need set older date
			 * revokeToken will expected return a boolean in future version
			 * https://github.com/oauthjs/node-oauth2-server/pull/274
			 * https://github.com/oauthjs/node-oauth2-server/issues/290
			 */
			var expiredCode = code;
			expiredCode.expiresAt = new Date("2015-05-28T06:59:53.000Z");
			return expiredCode;
		})
		.catch(function(err) {
			console.log("getUser - Err: ", err);
		});
}

function revokeToken(token) {
	console.log("revokeToken", token);
	return OAuthRefreshToken.findOne({
		where: {
			refresh_token: token.refreshToken
		}
	})
		.then(function(rT) {
			if (rT) rT.destroy();
			/***
			 * As per the discussion we need set older date
			 * revokeToken will expected return a boolean in future version
			 * https://github.com/oauthjs/node-oauth2-server/pull/274
			 * https://github.com/oauthjs/node-oauth2-server/issues/290
			 */
			var expiredToken = token;
			expiredToken.refreshTokenExpiresAt = new Date(
				"2015-05-28T06:59:53.000Z"
			);
			return expiredToken;
		})
		.catch(function(err) {
			console.log("revokeToken - Err: ", err);
		});
}

function saveToken(token, client, user) {
	return Promise.all([
		OAuthAccessToken.create({
			access_token: token.accessToken,
			expires: token.accessTokenExpiresAt,
			OAuthClient: client._id,
			user: user ? user._id : null,
			scope: token.scope
		}),
		token.refreshToken
			? OAuthRefreshToken.create({
					// no refresh token for client_credentials
					refresh_token: token.refreshToken,
					expires: token.refreshTokenExpiresAt,
					OAuthClient: client._id,
					user: user ? user._id : null,
					scope: token.scope
			  })
			: []
	])
		.then(function(resultsArray) {
			return _.assign(
				// expected to return client and user, but not returning
				{
					client: client,
					user: user
					// /access_token: token.accessToken, // proxy
					//refresh_token: token.refreshToken, // proxy
				},
				token
			);
		})
		.catch(function(err) {
			console.log("revokeToken - Err: ", err);
		});
}

function getAuthorizationCode(code) {
	return OAuthAuthorizationCode.findOne({ authorization_code: code })
		.populate("user")
		.populate("OAuthClient")
		.then(function(authCodeModel) {
			if (!authCodeModel) return false;
			var client = authCodeModel.OAuthClient;
			var user = authCodeModel.User;
			return (reCode = {
				code: code,
				client: client,
				expiresAt: authCodeModel.expires,
				redirectUri: client.redirect_uri,
				user: user,
				scope: authCodeModel.scope
			});
		})
		.catch(function(err) {
			console.log("getAuthorizationCode - Err: ", err);
		});
}

function saveAuthorizationCode(code, client, user) {
	return OAuthAuthorizationCode.create({
		expires: code.expiresAt,
		OAuthClient: client._id,
		authorization_code: code.authorizationCode,
		user: user ? user.user && user.user._id : null,
		scope: code.scope
	})
		.then(function() {
			code.code = code.authorizationCode;
			return code;
		})
		.catch(function(err) {
			console.log("saveAuthorizationCode - Err: ", err);
		});
}

function getUserFromClient(client) {
	console.log("getUserFromClient", client);
	var options = { client_id: client.client_id };
	if (client.client_secret) options.client_secret = client.client_secret;

	return OAuthClient.findOne(options)
		.populate("user")
		.then(function(client) {
			console.log(client);
			if (!client) return false;
			if (!client.user) return false;
			return client.user;
		})
		.catch(function(err) {
			console.log("getUserFromClient - Err: ", err);
		});
}

function getRefreshToken(refreshToken) {
	// console.log("getRefreshToken", refreshToken)
	if (!refreshToken || refreshToken === "undefined") return false;
	//[OAuthClient, User]
	return OAuthRefreshToken.findOne({ refresh_token: refreshToken })
		.populate("user")
		.populate("OAuthClient")
		.then(function(savedRT) {
			if (savedRT) {
				var tokenTemp = {
					user: savedRT ? savedRT.user : {},
					client: savedRT ? savedRT.OAuthClient : {},
					refreshTokenExpiresAt: savedRT
						? new Date(savedRT.expires)
						: null,
					refreshToken: refreshToken,
					refresh_token: refreshToken,
					scope: savedRT.scope
				};
				return tokenTemp;
			} else {
				return null;
			}
			// console.log("srt",savedRT)
		})
		.catch(function(err) {
			console.log("getRefreshToken - Err: ", err);
		});
}

function validateScope(token, client, scope) {
	console.log("validateScope", token, client, scope);
	return user.scope === client.scope ? scope : false;
}

function verifyScope(token, scope) {
	console.log("verifyScope", token, scope);
	return token.scope === scope;
}
module.exports = {
	//generateOAuthAccessToken, optional - used for jwt
	//generateAuthorizationCode, optional
	//generateOAuthRefreshToken, - optional
	getAccessToken: getAccessToken,
	getAuthorizationCode: getAuthorizationCode, //getOAuthAuthorizationCode renamed to,
	getClient: getClient,
	getRefreshToken: getRefreshToken,
	getUser: getUser,
	getUserFromClient: getUserFromClient,
	//grantTypeAllowed, Removed in oauth2-server 3.0
	revokeAuthorizationCode: revokeAuthorizationCode,
	revokeToken: revokeToken,
	saveToken: saveToken, //saveOAuthAccessToken, renamed to
	saveAuthorizationCode: saveAuthorizationCode, //renamed saveOAuthAuthorizationCode,
	//validateScope: validateScope,
	verifyScope: verifyScope
};
