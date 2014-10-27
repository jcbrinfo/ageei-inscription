/*
 * (c) JCBR Info
 */

var sqlite = require("sqlite3");
var fs = require("fs");
var path = require("path");

var DATA_PATH = path.join(__dirname, "../../data/inscriptions");
var AVAILIBILITY_SEMESTER = "2015-01";

/**
 * S’assure que la base de données est initialisée.
 *
 * À appeler au démarrage de l’application.
 */
exports.init = function (actionPerformed) {
	actionPerformed = OneTimeListener(actionPerformed);

	fs.exists(DATA_PATH + ".db", function (exists) {
		if (exists) {
			actionPerformed(null);
		} else {
			fs.readFile(DATA_PATH + ".sql", function (err, data) {
				if (err) {
					actionPerformed(err);
					return;
				}
				applySchema(data.toString(), actionPerformed);
			});
		}
	});
};

/**
 * Sauvegarde l’instance de `SubscriptionFormModel` spécifié.
 */
exports.save = function (model, actionPerformed) {
	actionPerformed = OneTimeListener(actionPerformed);
	fs.exists(DATA_PATH + ".db", function (exists) {
		if (!exists) {
			actionPerformed(Error("Database not initialized."));
			return;
		}
		var db = new sqlite.Database(DATA_PATH + ".db");
		var context = new Context(db, model, ErrorListener(actionPerformed));

		db.serialize(function () {
			beginTransaction(context.db, context.errorListener);
			saveMain(context);
		});

		db.close(actionPerformed);
	});
};

/**
 * Enveloppe l’écouteur afin qu’il soit appelé qu’une seule fois.
 */
var OneTimeListener = function (callback) {
	var called = false;

	return function (err) {
		if (!called) {
			callback(err);
			called = true;
		}
	};
};

/**
 * Enveloppe l’écouteur afin qu’il soit appelé en cas d’erreur.
 */
var ErrorListener = function (listener) {
	return function (error) {
		if (error) {
			listener(error);
		}
	};
};

/**
 * Un contexte de sauvegarde.
 */
var Context = function (db, model, errorListener) {
	this.db = db;
	this.errorListener = errorListener;
	this.model = model;
	this.id = -1;
};

var beginTransaction = function (db, listener) {
	db.exec("pragma foreign_keys = ON; begin transaction;", listener);
};

var commit = function (db, listener) {
	db.exec("commit;", listener);
};

var applySchema = function (schema, actionPerformed) {
	var db = new sqlite.Database(DATA_PATH + ".db");
	var errorListener = ErrorListener(actionPerformed);

	db.serialize(function () {
		beginTransaction(db, errorListener);
		db.exec(trimComments(schema), errorListener);
		commit(db, errorListener);
	});

	db.close(actionPerformed);
};

var COMMENT_REGEXP = /--[^\n]*\n/g;

var trimComments = function (query) {
	return query.replace(COMMENT_REGEXP, "");
};

var saveMain = function (context) {
	var stmt = context.db.prepare("insert into Inscription(mdate, last_name, first_name, alias, email, last_semester, tshirt_size, diet) values(date('now'), $last_name, $first_name, $alias, $email, $last_semester, $tshirt_size, $diet);",
			context.errorListener);
	var values = context.model.values;

	stmt.run({
		$last_name: values.last_name,
		$first_name: values.first_name,
		$alias: values.alias,
		$email: values.email,
		$last_semester: values.last_semester,
		$tshirt_size: values.tshirt_size,
		$diet: context.model.getDiet()
	});
	stmt.finalize();
	context.db.get("select last_insert_rowid() as id", function(err, row) {
		if (err) {
			context.errorListener(err);
			return;
		}
		context.id = row["id"];
		saveLinked(context);
	});
};

var saveLinked = function (context) {
	context.db.serialize(function () {
		saveFoodAllergies(context);
		saveAvailibility(context, context.model.values.availibility,
				context.model.AVALIBILITY_SEMESTER);
		saveInterests(context);
		saveSkills(context);
		savePractices(context);
		saveLangSkills(context);
		saveContestParticipations(context);
		saveContestIdeas(context);
		commit(context.db, context.errorListener);
	});
};

var saveFoodAllergies = function (context) {
	var stmt = context.db.prepare("insert into FoodAllergy(Insciption_id, item) values($Inscription_id, $item);",
			context.errorListener);
	var items = context.model.getFoodAllergies();

	for (var i = 0; i < items.length; ++i) {
		stmt.run({
			$Inscription_id: context.id,
			$item: items[i]
		}, context.errorListener);
	}
	stmt.finalize();
};

var saveAvailibility = function (context, availibility, semester) {
	var stmt = context.db.prepare("insert into Availibility(Insciption_id, semester, day, period) values($Inscription_id, $semester, $day, $period);",
			context.errorListener);
	var i = 0;
	var j = 0;

	for (; i < availibility.periods.length; ++i) {
		for (j = 0; j < availibility.days.length; ++j) {
			if (availibility.get(availibility.days[j], availibility.periods[i])) {
				stmt.run({
					$Inscription_id: context.id,
					$semester: semester,
					$day: availibility.days[j],
					$period: availibility.periods[i]
				}, context.errorListener);
			}
		}
	}
	stmt.finalize();
};

var saveInterests = function (context) {
	var stmt = context.db.prepare("insert into Interest(Insciption_id, key, interest_rank) values($Inscription_id, $key, $value);",
			context.errorListener);
	var i = 0;
	var keys = context.model.INTEREST_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: context.id,
			$key: keys[i],
			$value: context.model.getInterestRank(keys[i])
		}, context.errorListener);
	}
	stmt.finalize();
};

var saveSkills = function (context) {
	var stmt = context.db.prepare("insert into Skill(Insciption_id, key, skill_level) values($Inscription_id, $key, $value);",
			context.errorListener);
	var i = 0;
	var keys = context.model.SKILL_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: context.id,
			$key: keys[i],
			$value: context.model.getSkillLevel(keys[i])
		}, context.errorListener);
	}
	stmt.finalize();
};

var savePractices = function (context) {
	var stmt = context.db.prepare("insert into Practice(Insciption_id, key, practice_level) values($Inscription_id, $key, $value);",
			context.errorListener);
	var i = 0;
	var keys = context.model.PRACTICE_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: context.id,
			$key: keys[i],
			$value: context.model.getPracticeLevel(keys[i])
		}, context.errorListener);
	}
	stmt.finalize();
};

var saveLangSkills = function (context) {
	var stmt = context.db.prepare("insert into Language_Skill(Insciption_id, key, skill_level) values($Inscription_id, $key, $value);",
			context.errorListener);
	var i = 0;
	var keys = context.model.LANG_SKILL_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: context.id,
			$key: keys[i],
			$value: context.model.getLangSkillLevel(keys[i])
		}, context.errorListener);
	}
	stmt.finalize();
};

var saveContestParticipations = function (context) {
	var stmt = context.db.prepare("insert into Contest_Participation(Insciption_id, contest, pariticipation, available_for_checkin) values($Inscription_id, $key, $pariticipation, $checking);",
			context.errorListener);
	var i = 0;
	var keys = context.model.CONTESTS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: context.id,
			$key: keys[i],
			$pariticipation: context.model.values.participation[keys[i]]? 1 : 0,
			$checkin: context.model.values.checkin[keys[i]]? 1 : 0
		}, context.errorListener);
	}
	stmt.finalize();
};

var saveContestIdeas = function (context) {
	var stmt = context.db.prepare("insert into Contest_Ideas(Insciption_id, contest, category, content) values($Inscription_id, $contest, $category, $content);",
			context.errorListener);
	var i = 0;
	var j = 0;
	var contests = context.model.CONTESTS;
	var categories = context.model.IDEA_CATEGORIES;

	for (; i < contests.length; ++i) {
		for (j = 0; j < categories.length; ++j) {
			stmt.run({
				$Inscription_id: context.id,
				$contest: contests[i],
				$category: categories[i],
				$content: context.model.getIdeas(contests[i], categories[i])
			}, context.errorListener);
		}
	}
	stmt.finalize();
};
