/*
 * (c) JCBR Info
 */

/**
 * Module dependencies.
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var db = require("./model/db.js");

// Configuration
var app = express();
var router = express.Router();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = false;
app.locals.self = true;

app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

router.get('/', require('./routes/index').get);
router.get('/inscription/reussite', require('./routes/reussite').get);
router.get('/inscription', require('./routes/inscription').get);
router.post('/inscription', require('./routes/inscription').post);
app.use("/", router);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.name = "NotFoundError";
	err.status = 404;
	next(err);
});

/// error handlers

var getDefaultErrorMessage = function (status) {
	var knownStatuses = {
		http3: {
			short: "Redirection",
			long: "Votre fureteur devrait vous rediriger ailleurs."
		},
		http300: {
			short: "Plusieurs choix",
			long: "À vous (ou à votre fureteur) de choisir."
		},
		http301: {
			short: "Page déplacée de façon permanente",
			long: "Cette page est rendue ailleurs."
		},
		http302: {
			short: "Page trouvée",
			long: "Cette page se trouve ailleurs."
		},
		http303: {
			short: "Voir ailleurs",
			long: "Allez voir la page demandée ailleurs."
		},
		http304: {
			short: "Cette page n’a pas été modifié",
			long: "On n’a pas besoin de vous redonner cette page puisqu’elle n’a pas été modifié."
		},
		http305: {
			short: "Utilisez un serveur mandataire",
			long: "Veuillez utiliser un serveur mandataire."
		},
		http307: {
			short: "Redirection temporaire",
			long: "Nous vous renvoyons ailleurs temporairement."
		},
		http308: {
			short: "Redirection permanente",
			long: "Cette page est rendue ailleurs."
		},
		http4: {
			short: "Erreur du client",
			long: "C’est de votre faute!"
		},
		http400: {
			short: "Mauvaise requête",
			long: "La requête a été mal formulée."
		},
		http401: {
			short: "Non autorisé",
			long: "Vous devez vous authentifier pour accéder à cette page."
		},
		http402: {
			short: "Paiement requis",
			long: "Vous devez payer pour accéder à cette page."
		},
		http403: {
			short: "Interdit",
			long: "Vous n’êtes pas authorisé à accéder à cette page ou l’authentification à échoué."
		},
		http404: {
			short: "Page introuvable",
			long: "La page que vous cherchez n’est pas ici."
		},
		http405: {
			short: "Méthode interdite",
			long: "La page que vous avez demandée ne peut être acquise par la méthode utilisée."
		},
		http406: {
			short: "Inacceptable",
			long: "La ressource demandée ne répond pas aux critères exigés par le fureteur."
		},
		http407: {
			short: "Authentification avec le serveur mandataire requise",
			long: "Vous devez vous authentifier auprès du serveur mandataire."
		},
		http408: {
			short: "Trop tard",
			long: "Vous avez pris trop de temps pour envoyer votre requête."
		},
		http409: {
			short: "Conflit",
			long: "Votre requête entre en conflit avec une autre."
		},
		http410: {
			short: "Perdue",
			long: "La page demandée n'existe plus."
		},
		http411: {
			short: "Longueur requise",
			long: "La requête doit spécifier une longueur."
		},
		http412: {
			short: "Échec d’une précondition",
			long: "Un précondition exigée n’a pas pu être respecté."
		},
		http413: {
			short: "Requête trop longue",
			long: "La requête est plus longue que ce que le serveur peut traiter."
		},
		http414: {
			short: "URI trop long",
			long: "L’URI spécifié est trop long."
		},
		http415: {
			short: "Format non supporté",
			long: "Le format sous lequel les données ont été envoyés n’est pas supporté."
		},
		http416: {
			short: "Intervalle invalide",
			long: "L’intervalle demandé ne correspond pas à du contenu valide."
		},
		http417: {
			short: "Inattendu",
			long: "Le serveur n’a pas réussit à satisfaire les attentes du fureteur."
		},
		http418: {
			short: "Je suis une théière",
			long: "Vous ne pensiez tout de même pas que j’étais un serveur?!"
		},
		http419: {
			short: "Session expirée",
			long: "Veuillez vous réauthentifiée."
		},
		http422: {
			short: "Requête intraitable",
			long: "Il y a quelques erreurs sémantiques dans la requête."
		},
		http423: {
			short: "Page verrouillée",
			long: "La page demandée est bloquée."
		},
		http424: {
			short: "Échec d’une dépendance",
			long: "Le traitement de la présente requête dépendait d’une autre qui a échouée."
		},
		http426: {
			short: "Mise à niveau requise",
			long: "Veuillez passer à un protocole plus approprié."
		},
		http428: {
			short: "Précondition requise",
			long: "Votre fureteur doit spécifier une précondition."
		},
		http429: {
			short: "Trop de requêtes",
			long: "Vous envoyez trop de requêtes."
		},
		http431: {
			short: "En-tête de requête trop longue",
			long: "Nous refusons de traiter des en-tête aussi longues."
		},
		http5: {
			short: "Erreur du serveur",
			long: "C’est de notre faute. Désolé."
		},
		http500: {
			short: "Erreur interne du serveur",
			long: "Notre serveur n’a pas réussit à vous répondre et il ne sait pas pourquoi."
		},
		http501: {
			short: "Non implémenté",
			long: "Vous utilisez une fonctionnalité que nous ne supportons pas encore."
		},
		http502: {
			short: "Mauvaise passerelle",
			long: "Nous avons contacté quelqu’un d’autre et il nous a renvoyé une erreur."
		},
		http503: {
			short: "Service indisponible",
			long: "Nous sommes temporairement indisponible. Veuillez réessayer plus tard. Nous nous excusons des inconvéniens que cela peut vous causer."
		},
		http504: {
			short: "Passerelle expirée",
			long: "Nous avons contacté quelqu’un d’autre et il a mis trop de temps pour répondre."
		},
		http505: {
			short: "Version d’HTTP non supportée",
			long: "Vous utilisée une version d’HTTP trop récente pour notre vieux serveur (ou l’inverse)."
		},
		http506: {
			short: "La variante négocie aussi",
			long: "Nous sommes pris avec une référence circulaire."
		},
		http507: {
			short: "Espace insuffisant",
			long: "Il n’y a plus assez de place sur notre serveur."
		},
		http508: {
			short: "Boucle détectée",
			long: "Ouf! Nous avons eu chaud : nous avons presque parti dans une boucle infinie."
		}
	};

	var messageId = "http" + status;
	if (!(messageId in knownStatuses)) {
		messageId = "http" + ((status / 100) | 0);
		if (!(messageId in knownStatuses)) {
			messageId = "http500";
		}
	}
	return knownStatuses[messageId];
};

// Development error handler
if (app.get('env') === 'development') {
	app.locals.pretty = true;
	app.use(function(err, req, res, next) {
		var status = err.status || 500;

		res.status(status);
		res.render('error', {
			message: err.message,
			status: status,
			error: err,
			defaultMessage: getDefaultErrorMessage(status)
		});
	});
}

// Production error handler
app.use(function(err, req, res, next) {
	var status = err.status || 500;

	res.status(status);
	res.render('error', {
		message: err.message,
		status: status,
		error: {},
		defaultMessage: getDefaultErrorMessage(status)
	});
});

module.exports.init = function (setApp) {
	db.init(function () {
		setApp(app);
	});
};
