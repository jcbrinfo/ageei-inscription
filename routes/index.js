/*
 * (c) JCBR Info
 */

var express = require('express');
var router = express.Router();

/* GET home page. */
exports.get = function(req, res) {
	res.render('index', { title: '' });
};
