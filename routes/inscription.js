/*
 * (c) JCBR Info
 */

// Le formulaire d'inscription.

var Model = require("../lib/model").SubscriptionFormModel;

exports.get = function(req, res) {
	var model = new Model();

	res.render("inscription/page-0", model);
};

exports.post = function(req, res) {
	var model = new Model();

	if (".from-page" in req.body) {
		model.page = parseInt(req.body[".from-page"], 16)
		if (isNaN(model.page) || model.page < 0) {
			model.page = 0;
		} else if (model.page >= model.numberOfPages) {
			model.page = numberOfPages - 1;
		}
	}
	model.fromPage = model.page;
	model.setAll(req.body);
	if (".button" in req.body && req.body[".button"] === "back") {
		if (model.page > 0) {
			--model.page;
		}
	} else {
		++model.page;
	}
	model.validate();

	if (model.page == model.numberOfPages) {
		model.save(SuccessRedirection(res));
	} else {
		res.render("inscription/page-" + model.page.toString(16), model);
	}
};

var SuccessRedirection = function (res) {
	return function () {
		res.redirect(303, "inscription/reussite");
	};
};
