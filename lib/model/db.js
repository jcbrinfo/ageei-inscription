/*
 * (c) JCBR Info
 */

var sqlite = require("sqlite3");
var fs = require("fs");
var path = require("path");

var DATA_PATH = path.join(__dirname, "../data/inscription");
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
				if (err) {throw err;}
				applySchema(data);
			});
		}
	});
};

var beginTransaction = function (db) {
	db.run("pragma foreign_keys = ON; begin transaction;");
};

var commit = function (db) {
	db.run("commit;");
};

var applySchema = function (schema, actionPerformed) {
	var db = new sqlite.cached.Database(DATA_PATH + ".db",
			sqlite.OPEN_CREATE);
	db.serialize(function () {
		beginTransaction(db);
		db.run(schema);
		commit(db);
		db.close(function (err) {
			if (err !== null) {
				throw err;
			} else {
				actionPerformed();
			}
		};
	});
};

/**
 * Sauvegarde les valeurs l’instance de `SubscriptionFormModel` spécifié.
 */
exports.save = function (model, actionPerformed) {
	fs.exists(DATA_PATH + ".db", function (exists) {
		if (!exists) {
			throw Error("Database not initialized.");
		}
		var db = new sqlite.cached.Database(DATA_PATH + ".db",
				sqlite.OPEN_CREATE);
		db.serialize(function () {
			beginTransaction(db);
			saveValues(db, model.values);
			commit(db);
			db.close(function (err) {
				if (err !== null) {
					throw err;
				} else {
					actionPerformed();
				}
			};
		});
	});
};

var saveValues = function (db, values) {
	var stmt = db.prepare("insert into Inscription(mdate, last_name, first_name, email, last_semester, tshirt_size, diet) values(date('now'), $last_name, $first_name, $email, $last_semester, $tshirt_size, $diet);");

	stmt.run({
		$last_name: values.last_name,
		$first_name: values.first_name,
		$alias: values.alias,
		$email: values.email,
		$last_semester: values.last_semester,
		$tshirt_size: values.tshirt_size,
		$diet: values.diet
	});
	stmt.finalize();
	db.get("select last_insert_rowid() as id", function(err, row) {
		if (err !== null) {
			throw err;
		}
		saveValues2(db, values, row["id"]);
	});
};

var saveValues2 = function (db, values, Inscription_id) {
	// TODO
	//db.serialize(function () {
	//	var stmt = db.prepare("");
    //
	//	stmt.run({
	//		$Inscription_id: Inscription_id
	//	});
	//	stmt.finalize();
	//});
};
