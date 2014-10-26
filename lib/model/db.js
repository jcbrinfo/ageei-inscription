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
	fs.exists(DATA_PATH + ".db", function (exists) {
		if (exists) {
			actionPerformed();
		} else {
			fs.readFile(DATA_PATH + ".sql", function (err, data) {
				if (err) {
					actionPerformed(err);
					return;
				}
				//applySchema(data.toString(), actionPerformed);
				actionPerformed();
			});
		}
	});
};

var test = function (err) {
	if (err) {
		throw err;
	} else {
		console.log("done");
	}
}

var beginTransaction = function (db) {
	db.run("pragma foreign_keys = ON; begin transaction;", test);
};

var commit = function (db) {
	db.run("commit;", test);
};

var applySchema = function (schema, actionPerformed) {
	var db = new sqlite.cached.Database(DATA_PATH + ".db",
			sqlite.OPEN_CREATE);
	db.serialize(function () {
		console.log("begin");
		beginTransaction(db);
		db.run(schema, test);
		commit(db);
	});

	db.close(actionPerformed);
};

var CallOnce = function (callback) {
	var called = false;

	return function (err) {
		if (!called) {
			callback(err);
			called = true;
		}
	};
};

/**
 * Sauvegarde l’instance de `SubscriptionFormModel` spécifié.
 */
exports.save = function (model, actionPerformed) {
	actionPerformed = CallOnce(actionPerformed);
	fs.exists(DATA_PATH + ".db", function (exists) {
		if (!exists) {
			actionPerformed(Error("Database not initialized."));
			return;
		}
		var db = new sqlite.cached.Database(DATA_PATH + ".db",
				sqlite.OPEN_CREATE);

		db.serialize(function () {
			beginTransaction(db);
			saveMain(db, model, actionPerformed);
		});

		db.close(actionPerformed);
	});
};

var saveMain = function (db, model, errorListener) {
	var stmt = db.prepare("insert into Inscription(mdate, last_name, first_name, email, last_semester, tshirt_size, diet) values(date('now'), $last_name, $first_name, $email, $last_semester, $tshirt_size, $diet);");

	stmt.run({
		$last_name: model.values.last_name,
		$first_name: model.values.first_name,
		$alias: model.values.alias,
		$email: model.values.email,
		$last_semester: model.values.last_semester,
		$tshirt_size: model.values.tshirt_size,
		$diet: model.getDiet()
	});
	stmt.finalize();
	db.get("select last_insert_rowid() as id", function(err, row) {
		if (err) {
			errorListener(err);
			return;
		}
		saveLinked(db, model, row["id"]);
	});
};

var saveLinked = function (db, model, Inscription_id) {
	db.serialize(function () {
		saveFoodAllergies(db, model, Inscription_id);
		saveAvailibility(db, model.availibility, Inscription_id, model.AVALIBILITY_SEMESTER);
		saveInterests(db, model, Inscription_id);
		saveSkills(db, model, Inscription_id);
		savePractice(db, model, Inscription_id);
		saveLangSkills(db, model, Inscription_id);
		saveContestParticipations(db, model, Inscription_id);
		saveContestIdeas(db, model, Inscription_id);
		commit(db);
	});
};

var saveFoodAllergies = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into FoodAllergy(Insciption_id, item) values($Inscription_id, $item);");
	var items = model.getFoodAllergies();

	for (var i = 0; i < items.length; ++i) {
		stmt.run({
			$Inscription_id: Inscription_id,
			$item: items[i]
		});
	}
	stmt.finalize();
};

var saveAvailibility = function (db, availibility, Inscription_id, semester) {
	var stmt = db.prepare("insert into Availibility(Insciption_id, semester, day, period) values($Inscription_id, $semester, $day, $period);");
	var i = 0;
	var j = 0;

	for (; i < availibility.periods.length; ++i) {
		for (j = 0; j < availibility.days.length; ++j) {
			if (availibility.get(availibility.days[j], availibility.periods[i])) {
				stmt.run({
					$Inscription_id: Inscription_id,
					$semester: semester,
					$day: availibility.days[j],
					$period: availibility.periods[i]
				});
			}
		}
	}
	stmt.finalize();
};

var saveInterests = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into Interest(Insciption_id, key, interest_rank) values($Inscription_id, $key, $value);");
	var i = 0;
	var keys = model.INTEREST_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: Inscription_id,
			$key: keys[i],
			$value: model.getInterestRank(keys[i])
		});
	}
	stmt.finalize();
};

var saveSkills = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into Skill(Insciption_id, key, skill_level) values($Inscription_id, $key, $value);");
	var i = 0;
	var keys = model.SKILL_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: Inscription_id,
			$key: keys[i],
			$value: model.getSkillLevel(keys[i])
		});
	}
	stmt.finalize();
};

var savePractices = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into Practice(Insciption_id, key, practice_level) values($Inscription_id, $key, $value);");
	var i = 0;
	var keys = model.PRACTICE_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: Inscription_id,
			$key: keys[i],
			$value: model.getPracticeLevel(keys[i])
		});
	}
	stmt.finalize();
};

var saveLangSkills = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into Language_Skill(Insciption_id, key, skill_level) values($Inscription_id, $key, $value);");
	var i = 0;
	var keys = model.LANG_SKILL_FIELDS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: Inscription_id,
			$key: keys[i],
			$value: model.getLanguageSkillLevel(keys[i])
		});
	}
	stmt.finalize();
};

var saveContestParticipations = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into Contest_Participation(Insciption_id, contest, pariticipation, available_for_checkin) values($Inscription_id, $key, $pariticipation, $checking);");
	var i = 0;
	var keys = model.CONTESTS;

	for (; i < keys.length; ++i) {
		stmt.run({
			$Inscription_id: Inscription_id,
			$key: keys[i],
			$pariticipation: model.values.pariticipation[contest]? 1 : 0,
			$checkin: model.values.checkin[contest]? 1 : 0
		});
	}
	stmt.finalize();
};

var saveContestIdeas = function (db, model, Inscription_id) {
	var stmt = db.prepare("insert into Contest_Ideas(Insciption_id, contest, category, content) values($Inscription_id, $contest, $category, $content);");
	var i = 0;
	var j = 0;
	var contests = model.CONTESTS;
	var categories = model.IDEA_CATGORIES;

	for (; i < contests.length; ++i) {
		for (j = 0; categories.length; ++i) {
			stmt.run({
				$Inscription_id: Inscription_id,
				$contest: contests[i],
				$category: categories[i],
				$content: model.getIdeas(contests[i], categories[i])
			});
		}
	}
	stmt.finalize();
};
