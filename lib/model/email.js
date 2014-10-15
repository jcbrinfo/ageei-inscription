/*
 * (c) JCBR Info
 */

// Validation des adresses de courriel.

/**
 * Expression régulière utilisée en interne par `isValidAddress`.
 */
// address		= (<localPart>)@<domainPart>
// localPart	= <localSubPart>(?:\.<localSubPart>)*
// localSubPart	= <quoted>|<unquoted>
// quoted		= "(<quotedChar>|<escaped>)+"
// unquoted		= ([^\u0000-\u0020"\(\),\.:;<>@\[\\\]]|<escaped>)+
// quotedChar	= [^\n\r\\"]
// escaped		= \\[^\n\r]
// domainPart	= <domainLabel>(?:\.<domainLabel>)*\.<ldhLabel>\.?
// ldhLabel		= [A-Za-z](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?
// domainLabel	= [^\.\n\r]{1,63}
var ADDRESS_REGEXP = /^((?:(?:[^\u0000-\u0020"\(\),\.:;<>@\[\\\]]|\\[^\n\r])+|"(?:[^\n\r\\"]|\\[^\n\r])+")(?:\.(?:(?:[^\u0000-\u0020"\(\),\.:;<>@\[\\\]]|\\[^\n\r])+|"(?:[^\n\r\\"]|\\[^\n\r])+"))*)@[^\.\n\r]{1,63}(?:\.[^\.\n\r]{1,63})*\.[A-Za-z](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.?$/;

var utf8Length = function (text) {
	var length = text.length;
	var i = length - 1;
	var code;
	
	for (; i >= 0; --i) {
		code = text.charCodeAt(i);
		if (code <= 0x7F) {
			// U+0000	à U+007F	=> 1 octet	(7	+ 1 bits)
		} else if (code <= 0x7FF) {
			// U+0080	à U+07FF	=> 2 octets	(11	+ 5 bits)
			length += 1;
		} else if (code <= 0xD7FF | code >= 0xE000) {
			// U+0800	à U+FFFF	=> 3 octets	(16	+ 8 bits)
			length += 2;
		} else {
			// U+010000	à U+10FFFF	=> 4 octets	(21	+ 11 bits)
			// Encodé en 2 "surrogate" sous UTF-16.
			length += 2;
			--i;
		}
	}
	return length;
};

/**
 * Détermine si la chaîne de caractères passée en argument smble être
 * une addresse de courriel valide.
 *
 * Cette fonction ne vérifie que les principaux éléments de la syntaxe
 * sont respectés, tout en s'assurant de ne pas refuser d'adresse
 * potentiellement valide. La validation suit RFC 3696.
 *
 * Note : Les commentaires (mis entre parenthèses dans l'adresse) sont
 * refusés.
 *  
 * @param String address l'adresse à tester.
 * @return Boolean false si l'adresse courriel spécifiée ne respecte pas
 * la syntaxe. true si l'adresse spécifiée est possiblement valide.
 */
exports.isValidAddress = function (address) {
	if (address.length > 320) {
		// Considbérant que nombre d'octets UTF-8 >= nombre de seizets UTF-16…
		return false;
	}

	var match = ADDRESS_REGEXP.exec(address);
	// match[1] <- localPart

	if (match === null) {
		return false;
	} else if (utf8Length(match[1]) > 64) {
		return false;
	} else if (utf8Length(address.substring(match[1].length + 1)) > 255) {
		return false;
	} else {
		return true;
	}
};
