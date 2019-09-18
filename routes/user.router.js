const userRoute = function(app) {
	const UserController = require("../controllers/user.controller");
	app.route("/user/").get(UserController.welcome);
	app.route("/auth/save-user").post(UserController.saveUser);
	app.route("/user/get-all-user").get(UserController.getAllUsers);
};

module.exports = userRoute;
