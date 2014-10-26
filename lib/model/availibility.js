/*
 * (c) JCBR Info
 */

/**
 * Un calendrier de disponibilités.
 */
var Availibility = function () {
	this.fillDefaults();
};

Availibility.prototype.periods = [
	"9", "9_30", "11_30", "12_30", "13_30", "15_30", "16_30", "18", "20"
];

Availibility.prototype.days = [
	"sunday", "monday", "tuesday", "wenesday", "thursday", "friday", "saturday"
];

Availibility.prototype.fillDefaults = function () {
	var i = 0;

	for (; i < this.periods.length; ++i) {
		this["sunday_" + this.periods[i]] = true;
		this["monday_" + this.periods[i]] = false;
		this["tuesday_" + this.periods[i]] = false;
		this["wenesday_" + this.periods[i]] = false;
		this["thursday_" + this.periods[i]] = false;
		this["friday_" + this.periods[i]] = false;
		this["saturday_" + this.periods[i]] = true;
	}
};

/**
 * @return Array<String> L’ensembles des champs.
 */
Availibility.prototype.getOptions = function () {
	var result = [];
	var i = 0;
	var j = 0;

	for (; i < this.periods.length; ++i) {
		for (j = 0; j < this.days.length; ++j) {
			result.push(this.days[i] + "_" + this.periods[i]);
		}
	}
	return result;
};

/**
 * @param String day Le jour. Voir `days`.
 * @param String period La période. Voir `periods`.
 * @return Bool La disponibilité.
 */
Availibility.prototype.get = function (day, period) {
	return this[day + "_" + period];
};

exports.Availibility = Availibility;
