/*
 * (c) JCBR Info
 */

var db = require("./db.js");
var email = require("./email.js");
var Availibility = require("./availibility.js").Availibility;

/**
 * Le modèle du formulaire.
 */
var SubscriptionFormModel = function () {
	var i = 0;

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
		availibility: new Availibility(),

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

	// page-2
	for (i = 0; i < INTEREST_FIELDS.length; ++i) {
		values["interest_" + INTEREST_FIELDS[i]] = "";
	}
	for (i = 0; i < SKILL_FIELDS.length; ++i) {
		values["skill_" + SKILL_FIELDS[i]] = "";
	}
	for (i = 0; i < PRACTICE_FIELDS.length; ++i) {
		values["practice_" + PRACTICE_FIELDS[i]] = "";
	}
	for (i = 0; i < LANG_SKILL_FIELDS.length; ++i) {
		values["lang_skill_" + LANG_SKILL_FIELDS[i]] = "";
	}

	// L'ensemble des champs dont la valeur est invalide.
	this.invalid = {};
};

var SEMESTER_REGEXP = /^[0-9]{4}-0[159]$/;
var TSHIRT_SIZE_REGEXP = /^(?:XS|S|M|L|XL|XXL)$/;
var DIET_REGEXP = /^(?:|kashrut|halal|vegetarianism|veganism|other)$/;
var RANK_REGEXP = /^-[1-9A-F]$/;
var LEVEL_REGEXP = /^[0-4]$/;
var LANG_SKILL_REGEXP = /^(?:beginer|elementary|intermediate|intermediate-elevated|advanced|master)$/;
var FOOD_ALLERGIES_OPTIONS = ["peanuts", "wheat", "lactose", "milk", "eggs",
		"fishes", "soy", "seafood", "other"];
var INTEREST_FIELDS = ["db", "gui", "crypt", "embeded", "theory", "ai", "games",
		"maintenace", "perf", "team", "rt", "security", "social", "sports",
		"web"];
var SKILL_FIELDS = ["rdb", "nosql", "big_data", "gui", "crypt", "embedbed",
		"theory", "ai", "maintenance", "team", "rt", "security", "web"];
var PRACTICE_FIELDS = ["games", "sports"];
var LANG_SKILL_FIELDS = ["en"];
var CONTESTS = ["csgames"];
var IDEA_CATEGORIES = ["scream", "team_name", "costumes", "video", "gags", "other_ideas"];

/**
 * @var Array<String> L’ensemble des options prédéfinies pour les intollérances
 * alimentaires. Le dernier élément correspond à l’option « Autre ».
 */
SubscriptionFormModel.prototype.FOOD_ALLERGIES_OPTIONS = FOOD_ALLERGIES_OPTIONS;

SubscriptionFormModel.prototype.INTEREST_FIELDS = INTEREST_FIELDS;
SubscriptionFormModel.prototype.SKILL_FIELDS = SKILL_FIELDS;
SubscriptionFormModel.prototype.PRACTICE_FIELDS = PRACTICE_FIELDS;
SubscriptionFormModel.prototype.LANG_SKILL_FIELDS = LANG_SKILL_FIELDS;
SubscriptionFormModel.prototype.CONTESTS = CONTESTS;
SubscriptionFormModel.prototype.IDEA_CATEGORIES = IDEA_CATEGORIES;
SubscriptionFormModel.prototype.AVAILIBILITY_SEMESTER = "2015-01";

// Fonctions pour la vue.
SubscriptionFormModel.prototype.utils = require("../jade-forms");

/**
 * Modifie les données selon le corps de requête spécifié.
 */
SubscriptionFormModel.prototype.setAll = function (body) {
	// Appliquer les anciennes données.
	if (".previous-data" in body) {
		this.setAllOnce(JSON.parse(body[".previous-data"]));
	}
	// Réinitialiser les cases à cocher.
	if (this.fromPage === 0) {
		this.resetOptions("food_allergies", FOOD_ALLERGIES_OPTIONS);
	} else if (this.fromPage === 1) {
		this.resetOptions("availibility", this.values.availibility.getOptions());
	} else if (this.fromPage === 3) {
		this.resetOptions("participation", ["csgames"]);
		this.resetOptions("checkin", ["csgames"]);
	}
	// Appliquer les nouvelles données.
	this.setAllOnce(body);
};

/**
 * Comme `set_all`, mais ne tien pas compte des valeurs précédentes.
 */
SubscriptionFormModel.prototype.setAllOnce = function (body) {
	var i = 0;

	if (typeof body !== "object") {
		throw Error("Le format du corps de la requête est invalide.");
	}
	this.setUsing(body, "last_name");
	this.setUsing(body, "first_name");
	this.setUsing(body, "alias");
	this.setUsing(body, "email");
	this.setUsing(body, "last_semester");
	this.setUsing(body, "tshirt_size");
	this.setOptionsUsing(body, "food_allergies", FOOD_ALLERGIES_OPTIONS);
	if (this.values.food_allergies.other) {
		this.setUsing(body, "food_allergies_other");
	}
	this.setUsing(body, "diet");
	if (this.values.diet === "other") {
		this.setUsing(body, "diet_other");
	}

	this.setOptionsUsing(body, "availibility", this.values.availibility.getOptions());

	for (i = 0; i < INTEREST_FIELDS.length; ++i) {
		this.setUsing(body, "interest_" + INTEREST_FIELDS[i]);
	}
	for (i = 0; i < SKILL_FIELDS.length; ++i) {
		this.setUsing(body, "skill_" + SKILL_FIELDS[i]);
	}
	for (i = 0; i < PRACTICE_FIELDS.length; ++i) {
		this.setUsing(body, "practice_" + PRACTICE_FIELDS[i]);
	}
	for (i = 0; i < LANG_SKILL_FIELDS.length; ++i) {
		this.setUsing(body, "lang_skill_" + LANG_SKILL_FIELDS[i]);
	}

	this.setOptionsUsing(body, "participation", CONTESTS);
	this.setOptionsUsing(body, "checkin", CONTESTS);
	this.setUsing(body, "csgames_scream");
	this.setUsing(body, "csgames_team_name");
	this.setUsing(body, "csgames_costumes");
	this.setUsing(body, "csgames_video");
	this.setUsing(body, "csgames_gags");
	this.setUsing(body, "csgames_other_ideas");
};

SubscriptionFormModel.prototype.setUsing = function (body, field) {
	if (field in body) {
		this.values[field] = body[field];
	}
};

SubscriptionFormModel.prototype.resetOptions = function (field, options) {
	for (var i = 0; i < options.length; ++i) {
		this.values[field][options[i]] = false;
	}
};

SubscriptionFormModel.prototype.setOptionsUsing = function (body, field, options) {
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
	db.save(this);
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

		s &= self.expectNotEmptyString("last_name");
		s &= self.expectNotEmptyString("first_name");
		s &= self.expectString("alias");
		s &= self.expectEmail("email");
		s &= self.expectRegexp("last_semester", SEMESTER_REGEXP);
		s &= self.expectRegexp("tshirt_size", TSHIRT_SIZE_REGEXP);
		// Aucune validation pour `food_allergies` (valeurs invalides ignorées).
		s &= self.expectString("food_allergies_other");
		s &= self.expectRegexp("diet", DIET_REGEXP);
		s &= self.expectString("diet_other");
		return s;
	},
	function (self) {
		var s = true;

		// Aucune validation pour `availibility` (valeurs invalides ignorées).
		return s;
	},
	function (self) {
		var s = true;

		for (i = 0; i < INTEREST_FIELDS.length; ++i) {
			s &= self.expectRegexp("interest_" + INTEREST_FIELDS[i], RANK_REGEXP);
		}
		for (i = 0; i < SKILL_FIELDS.length; ++i) {
			s &= self.expectRegexp("skill_" + SKILL_FIELDS[i], LEVEL_REGEXP);
		}
		for (i = 0; i < PRACTICE_FIELDS.length; ++i) {
			s &= self.expectRegexp("practice_" + PRACTICE_FIELDS[i], LEVEL_REGEXP);
		}
		for (i = 0; i < LANG_SKILL_FIELDS.length; ++i) {
			s &= self.expectRegexp("lang_skill_" + LANG_SKILL_FIELDS[i], LANG_SKILL_REGEXP);
		}
		return s;
	},
	function (self) {
		var s = true;

		// Aucune validation pour `participation` (valeurs invalides ignorées).
		// Aucune validation pour `checkin` (valeurs invalides ignorées).
		s &= self.expectString("csgames_scream");
		s &= self.expectString("csgames_team_name");
		s &= self.expectString("csgames_costumes");
		s &= self.expectString("csgames_video");
		s &= self.expectString("csgames_gags");
		s &= self.expectString("csgames_other_ideas");
		return s;
	}
];

/**
 * @return String La diète suivie par le répondant.
 */
SubscriptionFormModel.prototype.getDiet = function () {
	if (this.values.diet === "other") {
		return this.values.diet_other;
	} else {
		return this.values.diet;
	}
};

/**
 * @return Array<String> L’ensemble des intollérances alimentaires.
 */
SubscriptionFormModel.prototype.getFoodAllergies = function () {
	var result = [];
	var i = 0;
	var length = FOOD_ALLERGIES_OPTIONS.length -1

	for (; i < length; ++i) {
		if (this.values.food_allergies[FOOD_ALLERGIES_OPTIONS[i]]) {
			result.push(FOOD_ALLERGIES_OPTIONS[i]);
		}
	}
	if (this.values.food_allergies[FOOD_ALLERGIES_OPTIONS[length]]) {
		result.push(this.values.food_allergies_other);
	}
	return result;
};

/**
 * @param String name le nom interne de l’intérêt. Voir `INTEREST_FIELDS`.
 * @return Integer Le rang (nombre négatif) de l’intérêt spécifié.
 */
SubscriptionFormModel.prototype.getInterestRank = function (name) {
	return paresInt(this.values["interest_" + name], 16);
};

/**
 * @param String name le nom interne du champ de compétence. Voir `SKILL_FIELDS`.
 * @return Integer Le niveau de compétence (0 à 4) pour le champ spécifié.
 */
SubscriptionFormModel.prototype.getSkillLevel = function (name) {
	return paresInt(this.values["skill_" + name], 16);
};

/**
 * @param String name le nom interne de la discipline. Voir `PRACTICE_FIELDS`.
 * @return Integer Le niveau de pratique (0 à 4) pour la discipline spécifiée.
 */
SubscriptionFormModel.prototype.getPracticeLevel = function (name) {
	return paresInt(this.values["practice_" + name], 16);
};

/**
 * @param String name le nom interne de la langue. Voir `LANG_SKILL_FIELDS`.
 * @return String Le niveau de compétence pour la langue spécifiée.
 */
SubscriptionFormModel.prototype.getPracticeLevel = function (name) {
	return this.values["lang_skill_" + name];
};

/**
 * @param String name le nom interne de la competition. Voir `CONTESTS`.
 * @param String category le nom interne de la catégorie. Voir `IDEA_CATEGORIES`.
 * @return String Les idées relatives à la compétition et à la catégorie spécifiées.
 */
SubscriptionFormModel.prototype.getIdeas = function (contest, category) {
	return this.values[contest + "_" + category];
};

SubscriptionFormModel.prototype.fireInvalid = function (field) {
	this.invalid[field] = true;
	this.hasErrors = true;
	return false;
};

SubscriptionFormModel.prototype.expectString = function (field) {
	return (typeof this.values[field] === "string") || this.fireInvalid(field);
};

SubscriptionFormModel.prototype.expect_not_empty = function (field) {
	return (this.values[field].length > 0) || this.fireInvalid(field);
};

SubscriptionFormModel.prototype.expectNotEmptyString = function (field) {
	return this.expectString(field) && this.expect_not_empty(field);
};

SubscriptionFormModel.prototype.expectEmail = function (field) {
	return this.expectNotEmptyString(field) && (email.isValidAddress(this.values[field]) || this.fireInvalid(field));
};

SubscriptionFormModel.prototype.expectRegexp = function (field, regexpObj) {
	return this.expectString(field) && (regexpObj.test(this.values[field]) || this.fireInvalid(field));
};

exports.SubscriptionFormModel = SubscriptionFormModel;
