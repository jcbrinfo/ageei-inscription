/*
 * (c) JCBR Info
 */

var email = require("./email.js");

/**
 * Le modèle du formulaire.
 */
SubscriptionFormModel = function () {
	// Vrai s'il existe des données invalides.
	this.hasErrors = false;

	// L'indice de la page du formulaire d’origine.
	//
	// Est utilisé pour réinitialiser les cases à cocher avant d’appliquer les
	// nouvelles données.
	this.fromPage = 0;

	// L'indice de la page du formulaire à afficher.
	//
	// Si égal à `numberOfPages`, correspond à page de confirmation.
	this.page = 0;

	// Le nombre de pages dans le formulaire.
	this.numberOfPages = 4;

	// La valeur des champs (nom -> valeur).
	this.values = {
		// page-0
		last_name: "",
		first_name: "",
		alias: "",
		email: "",
		last_semester: "",
		tshirt_size: "",
		food_allergies: {
			peanuts: false,
			wheat: false,
			lactose: false,
			milk: false,
			eggs: false,
			fishes: false,
			soy: false,
			seafood: false,
			other: false
		},
		food_allergies_other: "",
		diet: "",
		diet_other: "",

		// page-1
		availibility: this.default_availibility(),

		// page-2
		interest_db: "",
		interest_gui: "",
		interest_crypt: "",
		interest_embeded: "",
		interest_theory: "",
		interest_ai: "",
		interest_games: "",
		interest_maintenance: "",
		interest_perf: "",
		interest_team: "",
		interest_rt: "",
		interest_security: "",
		interest_social:"",
		interest_sports: "",
		interest_web: "",
		skills_rdb: "",
		skills_nosql: "",
		skills_big_data: "",
		skills_gui: "",
		skills_crypt: "",
		skills_embeded: "",
		skills_theory: "",
		skills_ai: "",
		skills_maintenance: "",
		skills_team: "",
		skills_rt: "",
		skills_security: "",
		skills_web: "",
		practice_games: "",
		practice_sports: "",
		lang_skills_en: "",

		// page-3
		participation: {
			csgames: false
		},
		checkin: {
			csgames: false
		},
		csgames_scream: "",
		csgames_team_name: "",
		csgames_costumes: "",
		csgames_video: "",
		csgames_gags: "",
		csgames_other_ideas: ""
	};

	// L'ensemble des champs dont la valeur est invalide.
	this.invalid = {};
};

var SEMESTER_REGEXP = /^[0-9]{4}-0[159]$/;
var TSHIRT_SIZE_REGEXP = /^(?:XS|S|M|L|XL|XXL)$/;
var DIET_REGEXP = /^(?:|kashrut|halal|vegetarianism|veganism|other)$/;
var RANK_REGEXP = /^-[1-9A-F]$/;
var LEVEL_REGEXP = /^[0-4]$/;
var LANG_SKILLS_REGEXP = /^(?:beginer|elementary|intermediate|intermediate-elevated|advanced|master)$/;
var FOOD_ALLERGIES_OPTIONS = ["peanuts", "wheat", "lactose", "milk", "eggs",
		"fishes", "soy", "seafood", "other"];
var CONTESTS = ["csgames"];

SubscriptionFormModel.prototype.FOOD_ALLERGIES_OPTIONS = FOOD_ALLERGIES_OPTIONS;
SubscriptionFormModel.prototype.CONTESTS = CONTESTS;

// Fonctions pour la vue.
SubscriptionFormModel.prototype.utils = require("../jade-forms");

SubscriptionFormModel.prototype.availibility_periods = [
	"9", "9_30", "11_30", "12_30", "13_30", "15_30", "16_30", "18", "20"
];

SubscriptionFormModel.prototype.default_availibility = function () {
	var result = {};
	var i = 0;

	for (; i < this.availibility_periods.length; ++i) {
		result["sunday_" + this.availibility_periods[i]] = true;
		result["monday_" + this.availibility_periods[i]] = false;
		result["tuesday_" + this.availibility_periods[i]] = false;
		result["wenesday_" + this.availibility_periods[i]] = false;
		result["thursday_" + this.availibility_periods[i]] = false;
		result["friday_" + this.availibility_periods[i]] = false;
		result["saturday_" + this.availibility_periods[i]] = true;
	}

	return result;
};

SubscriptionFormModel.prototype.availibility_options = function () {
	var result = [];
	var i = 0;

	for (; i < this.availibility_periods.length; ++i) {
		result.push("sunday_" + this.availibility_periods[i]);
		result.push("monday_" + this.availibility_periods[i]);
		result.push("tuesday_" + this.availibility_periods[i]);
		result.push("wenesday_" + this.availibility_periods[i]);
		result.push("thursday_" + this.availibility_periods[i]);
		result.push("friday_" + this.availibility_periods[i]);
		result.push("saturday_" + this.availibility_periods[i]);
	}

	return result;
};

/**
 * Modifie les données selon le corps de requête spécifié.
 */
SubscriptionFormModel.prototype.set_all = function (body) {
	// Appliquer les anciennes données.
	if (".previous-data" in body) {
		this.set_all_once(JSON.parse(body[".previous-data"]));
	}
	// Réinitialiser les cases à cocher.
	if (this.fromPage === 0) {
		this.reset_options("food_allergies", FOOD_ALLERGIES_OPTIONS);
	} else if (this.fromPage === 1) {
		this.reset_options("availibility", this.availibility_options());
	} else if (this.fromPage === 3) {
		this.reset_options("participation", ["csgames"]);
		this.reset_options("checkin", ["csgames"]);
	}
	// Appliquer les nouvelles données.
	this.set_all_once(body);
};

/**
 * Comme `set_all`, mais ne tien pas compte des valeurs précédentes.
 */
SubscriptionFormModel.prototype.set_all_once = function (body) {
	if (typeof body !== "object") {
		throw Error("Le format du corps de la requête est invalide.");
	}
	this.set_using(body, "last_name");
	this.set_using(body, "first_name");
	this.set_using(body, "alias");
	this.set_using(body, "email");
	this.set_using(body, "last_semester");
	this.set_using(body, "tshirt_size");
	this.set_options_using(body, "food_allergies", FOOD_ALLERGIES_OPTIONS);
	if (this.values.food_allergies.other) {
		this.set_using(body, "food_allergies_other");
	}
	this.set_using(body, "diet");
	if (this.values.diet === "other") {
		this.set_using(body, "diet_other");
	}

	this.set_options_using(body, "availibility", this.availibility_options());

	this.set_using(body, "interest_db");
	this.set_using(body, "interest_gui");
	this.set_using(body, "interest_crypt");
	this.set_using(body, "interest_embeded");
	this.set_using(body, "interest_theory");
	this.set_using(body, "interest_ai");
	this.set_using(body, "interest_maintenance");
	this.set_using(body, "interest_perf");
	this.set_using(body, "interest_team");
	this.set_using(body, "interest_rt");
	this.set_using(body, "interest_security");
	this.set_using(body, "interest_social");
	this.set_using(body, "interest_sports");
	this.set_using(body, "interest_web");
	this.set_using(body, "skills_rdb");
	this.set_using(body, "skills_nosql");
	this.set_using(body, "skills_big_data");
	this.set_using(body, "skills_gui");
	this.set_using(body, "skills_crypt");
	this.set_using(body, "skills_embeded");
	this.set_using(body, "skills_theory");
	this.set_using(body, "skills_ai");
	this.set_using(body, "skills_maintenance");
	this.set_using(body, "skills_team");
	this.set_using(body, "skills_rt");
	this.set_using(body, "skills_security");
	this.set_using(body, "skills_web");
	this.set_using(body, "practice_games");
	this.set_using(body, "practice_sports");
	this.set_using(body, "lang_skills_en");

	this.set_options_using(body, "participation", CONTESTS);
	this.set_options_using(body, "checkin", CONTESTS);
	this.set_using(body, "csgames_scream");
	this.set_using(body, "csgames_team_name");
	this.set_using(body, "csgames_costumes");
	this.set_using(body, "csgames_video");
	this.set_using(body, "csgames_gags");
	this.set_using(body, "csgames_other_ideas");
};

SubscriptionFormModel.prototype.set_using = function (body, field) {
	if (field in body) {
		this.values[field] = body[field];
	}
};

SubscriptionFormModel.prototype.reset_options = function (field, options) {
	for (var i = 0; i < options.length; ++i) {
		this.values[field][options[i]] = false;
	}
};

SubscriptionFormModel.prototype.set_options_using = function (body, field, options) {
	var postField = field + "[]";
	var i = 0;
	var checked = null;
	var length = 0;

	if (!(postField in body)) {
		if (field in body && (typeof body[field] === "object")) {
			copy_options(body[field], this.values[field], options);
		}
		return;
	}
	checked = body[postField];
	if (!(checked instanceof Array)) {return;}
	length = checked.length;

	for (i = 0; i < length; ++i) {
		var option = checked[i];
		if (option.toString() in this.values[field]) {
			this.values[field][option] = true;
		}
	}
};

var copy_options = function (src, dest, options) {
	for (var i = 0; i < options.length; ++i) {
		if (options[i] in src) {
			dest[options[i]] = !!src[options[i]];
		}
	}
};

/**
 * Sauvegarde les données.
 *
 * Ajoute entrée contenant les données saisies dans la base de données.
 */
SubscriptionFormModel.prototype.save = function (actionPerformed) {
	// TODO
	actionPerformed();
};

/**
 * Valide le formulaire jusqu'à (et excluant) `this.page`.
 *
 * S'il y a lieu, réduit `this.page` à première page contenant des données
 * erronées.
 */
SubscriptionFormModel.prototype.validate = function () {
	var n = this.page;

	for (this.page = 0; this.page < n && this.validatePage[this.page](this);
			++this.page) {
	}
};

/**
 * Indice de la page -> fonction qui valide la page.
 *
 * Chaque fonction retourne `true` si et seulement si les données reçues pour
 * la page sont valides.
 */
SubscriptionFormModel.prototype.validatePage = [
	function (self) {
		var s = true;

		s &= self.expect_not_empty_string("last_name");
		s &= self.expect_not_empty_string("first_name");
		s &= self.expect_string("alias");
		s &= self.expect_email("email");
		s &= self.expect_regexp("last_semester", SEMESTER_REGEXP);
		s &= self.expect_regexp("tshirt_size", TSHIRT_SIZE_REGEXP);
		// Aucune validation pour `food_allergies` (valeurs invalides ignorées).
		s &= self.expect_string("food_allergies_other");
		s &= self.expect_regexp("diet", DIET_REGEXP);
		s &= self.expect_string("diet_other");
		return s;
	},
	function (self) {
		var s = true;

		// Aucune validation pour `availibility` (valeurs invalides ignorées).
		return s;
	},
	function (self) {
		var s = true;

		s &= self.expect_regexp("interest_db", RANK_REGEXP);
		s &= self.expect_regexp("interest_gui", RANK_REGEXP);
		s &= self.expect_regexp("interest_crypt", RANK_REGEXP);
		s &= self.expect_regexp("interest_embeded", RANK_REGEXP);
		s &= self.expect_regexp("interest_theory", RANK_REGEXP);
		s &= self.expect_regexp("interest_ai", RANK_REGEXP);
		s &= self.expect_regexp("interest_maintenance", RANK_REGEXP);
		s &= self.expect_regexp("interest_perf", RANK_REGEXP);
		s &= self.expect_regexp("interest_team", RANK_REGEXP);
		s &= self.expect_regexp("interest_rt", RANK_REGEXP);
		s &= self.expect_regexp("interest_security", RANK_REGEXP);
		s &= self.expect_regexp("interest_social", RANK_REGEXP);
		s &= self.expect_regexp("interest_sports", RANK_REGEXP);
		s &= self.expect_regexp("interest_web", RANK_REGEXP);
		s &= self.expect_regexp("skills_rdb", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_nosql", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_big_data", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_gui", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_crypt", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_embeded", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_theory", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_ai", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_maintenance", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_team", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_rt", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_security", LEVEL_REGEXP);
		s &= self.expect_regexp("skills_web", LEVEL_REGEXP);
		s &= self.expect_regexp("practice_games", LEVEL_REGEXP);
		s &= self.expect_regexp("practice_sports", LEVEL_REGEXP);
		s &= self.expect_regexp("lang_skills_en", LANG_SKILLS_REGEXP);
		return s;
	},
	function (self) {
		var s = true;

		// Aucune validation pour `participation` (valeurs invalides ignorées).
		// Aucune validation pour `checkin` (valeurs invalides ignorées).
		s &= self.expect_string("csgames_scream");
		s &= self.expect_string("csgames_team_name");
		s &= self.expect_string("csgames_costumes");
		s &= self.expect_string("csgames_video");
		s &= self.expect_string("csgames_gags");
		s &= self.expect_string("csgames_other_ideas");
		return s;
	}
];

SubscriptionFormModel.prototype.fire_invalid = function (field) {
	this.invalid[field] = true;
	this.hasErrors = true;
	return false;
};

SubscriptionFormModel.prototype.expect_string = function (field) {
	return (typeof this.values[field] === "string") || this.fire_invalid(field);
};

SubscriptionFormModel.prototype.expect_not_empty = function (field) {
	return (this.values[field].length > 0) || this.fire_invalid(field);
};

SubscriptionFormModel.prototype.expect_not_empty_string = function (field) {
	return this.expect_string(field) && this.expect_not_empty(field);
};

SubscriptionFormModel.prototype.expect_email = function (field) {
	return this.expect_not_empty_string(field) && (email.isValidAddress(this.values[field]) || this.fire_invalid(field));
};

SubscriptionFormModel.prototype.expect_regexp = function (field, regexpObj) {
	return this.expect_string(field) && (regexpObj.test(this.values[field]) || this.fire_invalid(field));
};

exports.SubscriptionFormModel = SubscriptionFormModel;
