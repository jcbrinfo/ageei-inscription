/*
 * (c) JCBR Info
 */

// Diverses fonctions utilisées par `form.jade`.

/**
 * @param String name le nom interne du champ.
 * @return String la classe CSS de l'élément `label` associé.
 */
exports.getLabelClass = function (self, name) {
	if (name in self.invalid) {
		if (self.values[name] === "") {
			return "form-field-null";
		} else {
			return "form-field-fail";
		}
	} else {
		return null;
	}
}

/**
 * Détermine la valeur normalisée d'un attribut booléen.
 *
 * Est utilisé comme solution de contournement au comportement par défaut de
 * Jade qui est d'utiliser le nom de l'attribut comme valeur pour représenter
 * `true`, alors que la valeur recommandé est plutôt une chaîne de caractères
 * vide.
 *
 * @param Boolean value la valeur logique de l'attribut
 * @return String la valeur normalisé de l'attribut
 */
exports.xmlBool = function (value) {
	if (value) {
		return "";
	} else {
		return null; // Jade ignore les attributs null.
	}
}

exports.getOtherTextName = function (fieldSetName) {
	return fieldSetName + "_other";
}

exports.getFieldId = function (name) {
	return "form." + name;
}
