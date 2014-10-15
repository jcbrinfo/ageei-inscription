/*
 * (c) JCBR Info et autres
 */
ageei = {};
////////////////////////////////////////////////////////////////////////////////
ageei.strings = {};
/**
 * @param String text la chaîne de caractères à tester
 * @param String suffix la sous-chaîne de caractères recherchée
 * @return boolean true si et seulment si `text` se termine par `suffix`.
 */
ageei.strings.endsWith = function (text, suffix) {
	return text.indexOf(suffix, text.length - suffix.length) >= 0;
};

/**
 * @param String text
 * @return Integer la longueur, en octets, de la chaîne de caractères
 * spécifiée une fois encodée en UTF-8.
 */
ageei.strings.utf8Length = function (text) {
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


////////////////////////////////////////////////////////////////////////////////
ageei.dom = {};

/**
 * Adapteur sur un évènement.
 *
 * Utilisé en interne pour offrir une interface proche de celle de W3C DOM
 * (sauf pour `button`). Les propriété en lecture seule sont remplacés par des
 * accesseurs.
 *
 * @param Event inner l’évènement à adapter.
 *
 * @param Boolean oldMsie mettre à `true` si et seulement si attachEvent
 * a été utilisé
 */
ageei.dom.EventAdapter = (function () {
	var self = function (inner, oldMsie) {
		this.inner = inner;
		this.oldMsie = oldMsie;
	
		/**
		 * Utilisé en interne pour implémenter preventDefault.
		 *
		 * Ne pas configurer directement dans l’écouteur. Utilisez preventDefault à
		 * la place.
		 */
		this.returnValue = true;
	};

	self.prototype.getType = function () {
		return this.inner.type;
	};

	self.prototype.getTarget = function () {
		var result = null;

		if ("target" in this.inner) {
			result = this.inner.target;
		} else {
			result = this.inner.srcElement;
		}
		if (result.nodeType === 3) {
			// Bug Safari : this.inner.target est un nœud texte.
			result = result.parentNode;
		}
		return result;
	};

	//self.prototype.getCurrentTarget = function () {
	//	return this.currentTarget;
	//};

	self.prototype.getRelatedTarget = function () {
		if ("relatedTarget" in this.inner) {
			return this.inner.relatedTarget;
		} else if (ageei.strings.endsWith(this.type, "out") && "toElement" in this.inner) {
			return this.inner.toElement;
		} else if ("fromElement" in this.inner) {
			return this.inner.fromElement;
		} else {
			return null;
		}
	};

	self.prototype.getKeyCode = function () {
		// Peut valoir n’importe quoi si l’évènement n’est pas un évènement
		// du clavier.
		if ("keyCode" in this.inner) {
			return this.inner.keyCode;
		} else if ("which" in this.inner) {
			return this.inner.which;
		} else {
			return 0;
		}
	};

	self.prototype.getCharCode = function () {
		return this.inner.charCode || this.getKeyCode();
	};

	self.prototype.isAltKeyPressed = function () {
		if ("altKey" in this.inner) {
			return this.inner.altKey;
		} else if ("modifiers" in this.inner) {
			return this.inner.modfiers & 1;
		} else {
			return false;
		}
	};

	self.prototype.isCtrlKeyPressed = function () {
		if ("ctrlKey" in this.inner) {
			return this.inner.ctrlKey;
		} else if ("modifiers" in this.inner) {
			return this.inner.modfiers & 2;
		} else {
			return false;
		}
	};

	self.prototype.isMetaKeyPressed = function () {
		if ("metaKey" in this.inner) {
			return this.inner.metaKey;
		} else if ("modifiers" in this.inner) {
			return this.inner.modfiers & 8;
		} else {
			return false;
		}
	};

	self.prototype.isShiftKeyPressed = function () {
		if ("shiftKey" in this.inner) {
			return this.inner.shiftKey;
		} else if ("modifiers" in this.inner) {
			return this.inner.modfiers & 4;
		} else {
			return false;
		}
	};

	self.prototype.getModifiers = function () {
		var result = 0;

		if ("modifiers" in inner) {
			return this.inner.modifiers;
			this.altKey = this.modifiers & 1;
			this.ctrlKey = this.modifiers & 2;
			this.metaKey = this.modifiers & 8;
			this.shiftKey = this.modifiers & 4;
		} else {
			if (this.isAltKeyPressed()) {
				result |= 1;
			}
			if (this.isCtrlKeyPressed()) {
				result |= 2;
			}
			if (this.isMetaKeyPressed()) {
				result |= 8;
			}
			if (this.isShiftKeyPressed()) {
				result |= 4;
			}
			return result;
		}
	};

	/**
	 * Pour les évènements de la souris, le bouton enfoncé (ou les
	 * boutons enfoncés).
	 *
	 * Pour des raisons de compatibilités, la valeur diverge de la
	 * norme : on utilise les valeurs traditionnelles de MSIE < 9,
	 * soit :
	 *
	 *   *  1 : Premier button.
	 *   *  2 : Button appelant le menu contextuel.
	 *   *  4 : Button central ou molette.
	 *
	 * Pour MSIE < 9, il peut arriver que l’on est une disjonction de
	 * plusieurs des valeurs ci-dessus. Vaut 0 si on manque
	 * d’informations. Peut valoir n’importe quoi si l’évènement n’est
	 * pas un évènement de la souris.
	 */
	self.prototype.getButton = function () {
		if ("which" in this.inner) {
			// `which` suit le comportement de Netscape, sauf pour Opera 7.
			// Comme la version 7 d’Opéra n’est plus très jeune et que sa
			// déviance nécessite l’activation d’une option, on peut
			// l’ignorer sans trop de problèmes.
			switch (this.inner.which) {
				case 1:
					return 1;
				case 2:
					return 4;
				case 3:
					return 2;
				default:
					return 0;
			}
		} else if ("button" in this.inner) {
			// Cas MSIE < 9
			if (this.oldMsie) {
				// Note : MSIE < 9 renvoit systématiquement 0 pour certains
				// évènements.
				return this.inner.button;
			} else {
				// Cas W3C DOM.
				// Tous les fureteurs qui divergent du W3C DOM sont gérés
				// par les autres cas.
				switch (inner.button) {
					case 0:
						return 1;
					case 1:
						return 4;
					case 2:
						return 2;
					default:
						return 0;
				}
			}
		}
	};

	self.prototype.getClientX = function () {
		if ("clientX" in this.inner) {
			return this.inner.clientX;
		}
	};
	self.prototype.getClientY = function () {
		if ("clientY" in this.inner) {
			return this.inner.clientY;
		}
	};

	self.prototype.getScreenX = function () {
		if ("ScreenX" in this.inner) {
			return this.inner.ScreenX;
		}
	};
	self.prototype.getScreenY = function () {
		if ("ScreenY" in this.inner) {
			return this.inner.ScreenY;
		}
	};

	self.prototype.getPageX = function () {
		if ("PageX" in this.inner) {
			return this.inner.PageX;
		} else if ("clientX" in this.inner) {
			return this.inner.clientX + document.body.scrollLeft
					+ document.documentElement.scrollLeft;
		}
	};
	self.prototype.getPageY = function () {
		if ("PageY" in this.inner) {
			return this.inner.PageY;
		} else if ("clientY" in this.inner) {
			return this.inner.clientY + document.body.scrollTop
					+ document.documentElement.scrollTop;
		}
	};

	self.prototype.preventDefault = function () {
		if ("preventDefault" in this.inner) {
			this.inner.preventDefault();
		} else if ("returnValue" in this.inner) {
			this.inner.returnValue = false;
		}
		this.returnValue = false;
	};

	self.prototype.stopPropagation = function () {
		if ("stopPropagation" in this.inner) {
			this.inner.stopPropagation();
		} else {
			this.inner.cancelBubble = true;
		}
	};

	return self;
})();

/**
 * Utilisé en interne par `ageei.dom.addListener`.
 *
 * Est mis à part à cause d'un problème cité dans la section
 * « Use an event system for attaching event handlers » de
 * <https://developers.google.com/speed/articles/optimizing-javascript>.
 *
 * @param {EventListener|Function} listener l’écouteur
 * @param Boolean oldMsie mettre à `true` si et seulement si attachEvent
 * a été utilisé 
 * @return Function l'enveloppe pour l'écouteur.
 */
ageei.dom.getListenerWrapper = function (listener, oldMsie) {
	if ("handleEvent" in listener) {
		return function (e) {
			if (typeof e === "undefined") {
				var e = window.event;
			}
			listener.handleEvent(new ageei.dom.EventAdapter(e, oldMsie));
		};
	} else {
		return function (e) {
			if (typeof e === "undefined") {
				var e = window.event;
			}
			listener(new ageei.dom.EventAdapter(e, oldMsie));
		};
	}
};

/**
 * Ajoute un écouteur à la cible spécifiée.
 *
 * Les doublons sont ignorés. Lorsque possible, l’écouteur est appelé
 * durant la phase de remonté (« bubbling phase »).
 *
 * @param EventTarget target la cible de l’évènement
 *
 * @param String type le type de l’évènement (nomenclature W3C DOM).
 * Les évènements `DOM*` ne sont pas supportés.
 *
 * @param {EventListener|Function} listener l’écouteur
 *
 * @return Function la fonction à passer en argument à `removeListener`
 * pour retirer l’écouteur ajouté.
 */
ageei.dom.addListener = function (target, type, listener) {
	var wrapper;

	if ("addEventListener" in target) {
		wrapper = ageei.dom.getListenerWrapper(listener, false);
		target.addEventListener(type, wrapper, false);
	} else {
		wrapper = ageei.dom.getListenerWrapper(listener, true);
		target.attachEvent("on" + type, wrapper);
	}
	return wrapper;
};

/**
 * Retire un écouteur qui avait été ajouté avec `addListener`.
 *
 * @param EventTarget target la cible de l’évènement, tel que spécifié
 * à `addListener`.
 *
 * @param String type le type de l’évènement, tel que spécifié à
 * `addListener`.
 *
 * @param Function wrapper la fonction retournée par
 * `addListener` au moment de l’ajout de l’écouteur.
 */
ageei.dom.removeListener = function (target, type, wrapper) {
	if ("removeEventListener" in target) {
		target.removeEventListener(type, wrapper, false);
	} else {
		target.detachEvent("on" + type, wrapper);
	}
};

/**
 * Cherche des éléments selon les classes CSS appliqués.
 *
 * Droits d’auteur sur le code original :
 *
 * 	Developed by Robert Nyman, http://www.robertnyman.com
 * 	Code/licensing: http://code.google.com/p/getelementsbyclassname/
 *
 * @param {Element|document} elm Noeud ancêtre des éléments recherchés
 *
 * @param String className Une ou plusieurs classes CSS à chercher.
 * S’il y a plusieurs classes, un élément devra posséder toutes les
 * classes pour être retourné.
 *
 * @param String [tag] le type (nom local) des éléments recherchés
 *
 * @return Array<Element> la liste des éléments correspondant aux
 * critères spécifiés.
 */
ageei.dom.getElementsByClassName = function (elm, className, tag) {
	if ("getElementsByClassName" in document) {
		ageei.dom.getElementsByClassName = function (elm, className, tag) {
			var elements = elm.getElementsByClassName(className);
			var nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null;
			var result = [];
			var current;
			var i = 0;
			var length = elements.length;
			
			for (; i < length; ++i) {
				current = elements[i];
				if (nodeName === null || nodeName.test(current.nodeName)) {
					result.push(current);
				}
			}
			return result;
		};
	} else if ("evaluate" in document) {
		ageei.dom.getElementsByClassName = function (elm, className, tag) {
			tag = tag || "*";
			var classes = className.split(" ");
			var classesToCheck = ".//" + tag;
			var XHTML_NS = "http://www.w3.org/1999/xhtml";
			var documentNamespace = (document.documentElement.namespaceURI === XHTML_NS)? XHTML_NS : null;
			var result = [];
			var elements;
			var node;
			var i = 0;
			var length = classes.length;
			
			for (; i < length; ++j) {
				classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[i] + " ')]";
			}
			try	{
				elements = document.evaluate(classesToCheck, elm, documentNamespace, 0, null);
			} catch (e) {
				elements = document.evaluate(classesToCheck, elm, null, 0, null);
			}
			while (node = elements.iterateNext()) {
				result.push(node);
			}
			return result;
		};
	} else {
		ageei.dom.getElementsByClassName = function (elm, className, tag) {
			tag = tag || "*";
			var classes = className.split(" ");
			var classesToCheck = [];
			var elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag);
			var current;
			var returnElements = [];
			var match = false;
			var i = 0;
			var classesLength = classes.length;
			var j = 0;
			var elementsLength = elements.length;
			
			
			for (; i < classesLength; ++i) {
				classesToCheck.push(new RegExp("(^|\\s)" + classes[i] + "(\\s|$)"));
			}
			for (; j < elementsLength; ++j){
				current = elements[j];
				match = true;
				for (i = 0; i < classesLength; ++i) {
					if (!classesToCheck[i].test(current.className)) {
						match = false;
						break;
					}
				}
				if (match) {
					result.push(current);
				}
			}
			return result;
		};
	}
	return ageei.dom.getElementsByClassName(elm, className, tag);
};

/**
 * @param Element element l'élément ciblé
 * @param String attributeName le nom de l'attribut recherché
 * @return Boolean `true` si et seulement si l'élément spécifié possède
 * l'attribut spécifié.
 */
ageei.dom.hasAttribute = function (element, attributeName) {
	if ("hasAttribute" in document.documentElement) {
		// Fonctionne depuis DOM 2.
		ageei.dom.hasAttribute = function (element, attributeName) {
			return element.hasAttribute(attributeName);
		};
	} else {
		// Ne fonctionne plus depuis DOM 3.
		ageei.dom.hasAttribute = function (element, attributeName) {
			return element.getAttribute(attributeName) !== null;
		};
	}
	return ageei.dom.hasAttribute(element, attributeName);
};


////////////////////////////////////////////////////////////////////////////////
ageei.email = {};
		
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
ageei.email.ADDRESS_REGEXP = /^((?:(?:[^\u0000-\u0020"\(\),\.:;<>@\[\\\]]|\\[^\n\r])+|"(?:[^\n\r\\"]|\\[^\n\r])+")(?:\.(?:(?:[^\u0000-\u0020"\(\),\.:;<>@\[\\\]]|\\[^\n\r])+|"(?:[^\n\r\\"]|\\[^\n\r])+"))*)@[^\.\n\r]{1,63}(?:\.[^\.\n\r]{1,63})*\.[A-Za-z](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.?$/;

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
ageei.email.isValidAddress = function (address) {
	if (address.length > 320) {
		// Considbérant que nombre d'octets UTF-8 >= nombre de seizets UTF-16…
		return false;
	}

	var match = ageei.email.ADDRESS_REGEXP.exec(address);
	// match[1] <- localPart

	if (match === null) {
		return false;
	} else if (ageei.strings.utf8Length(match[1]) > 64) {
		return false;
	} else if (ageei.strings.utf8Length(address.substring(match[1].length + 1)) > 255) {
		return false;
	} else {
		return true;
	}
};


////////////////////////////////////////////////////////////////////////////////
ageei.forms = {};

/**
 * Détermine le formulaire qui est le plus proche ancêtre d'un élément.
 *
 * Note : Cette fonction ne tient pas compte de l'attribut "form".
 *
 * @param HtmlElement node l'élément de départ
 * @return HtmlElement l'élément de type "form" qui est le plus proche
 * ancêtre de l'élément spécifié ou null si un tel élément n'existe pas. 
 */
ageei.forms.getParentForm = function (node) {
	while (true) {
		node = node.parentNode;
		if (node === null) {
			return null;
		}
		switch (node.tagName.toLowerCase()) {
			case "form":
				return node;
			case "html":
				return null;
		}
	}
};

/**
 * Détermine l'étiquette qui est la plus proche ancêtre d'un élément.
 *
 * Note : Cette fonction ne tient pas compte de l'attribut "for".
 *
 * @param HtmlElement node l'élément de départ
 * @return HtmlElement l'élément de type "label" qui est le plus proche
 * ancêtre de l'élément spécifié ou null si un tel élément n'existe pas. 
 */
ageei.forms.getParentLabel = function (node) {
	while (true) {
		node = node.parentNode;
		if (node === null) {
			return null;
		}
		switch (node.tagName.toLowerCase()) {
			case "label":
				return node;
			case "html":
				return null;
		}
	}
};	

/**
 * Gestionnaire d'un champ avec une valeur non booléene.
 *
 * S'occupe de déterminer l'état de validation (vide, invalide ou
 * valide) du champ.
 *
 * @param HtmlElement field le champ géré
 * @param HtmlElement [label] l'étiquette associée
 * @abstract
 */
ageei.forms.ValueField = (function () {
	var self = function (field) {
		this.field = field

		/**
		 * L'étiquette associée. En l'absence d'étiquette, vaut `null`.
		 */
		this.label = ageei.forms.getParentLabel(field);
	};
	
	// null : requis, mais valeur vide.
	// fail : format invalide.
	// pass : correct.
	var STATE_REGEXP = /(?:^|\s)form-field-(null|fail|pass)(?:\s|$)/;

	self.prototype.setLabelState = function (state) {
		var match;
		var end;

		if (this.label !== null) {
			if (!this.label.className) {
				this.label.className = ["form-field-", state].join("");
			} else {
				match = STATE_REGEXP.exec(this.label.className);
				if (match === null) {
					this.label.className = [
								this.label.className,
								" form-field-", state
							].join("");
				} else {
					end = match.index + match[0].length;
					this.label.className = [
								this.label.className.substring(0,
									end - match[1].length),
								state,
								this.label.className.substring(end)
							].join("");
				}
			}
		}
	};
	
	/**
	 * Indique à l'utilisateur que l'information entrée est invalide.
	 */
	self.prototype.flagInvalid = function () {
		this.field.setAttribute("aria-invalid", "true");
		this.setLabelState("fail");
	};

	/**
	 * Indique à l'utilisateur que l'information entrée est valide.
	 */
	self.prototype.flagValid = function () {
		this.field.setAttribute("aria-invalid", "false");
		this.setLabelState("pass");
	};

	/**
	 * Indique à l'utilisateur, si nécessaire, que l'information entrée
	 * est manquante.
	 *
	 * Si le champ est optionel, indique à l'utilisateur que la valeur
	 * est valide.
	 */
	self.prototype.flagEmpty = function () {
		if (this.field.getAttribute("aria-required") === "true") {
			this.field.setAttribute("aria-invalid", "true");
			this.setLabelState("null");
		} else {
			this.flagValid();
		}
	};

	/**
	 * Retire l'état de validité.
	 *
	 * Utilisé lors de la réinitialisation du formulaire.
	 */
	self.prototype.removeValidityState = function () {
		var match;
		var end;
		
		if (ageei.dom.hasAttribute(this.field, "aria-invalid")) {
			this.field.removeAttribute("aria-invalid");
		}
		if (this.label !== null) {
			match = STATE_REGEXP.exec(this.label.className);
			if (match !== null) {
				end = match.index + match[0].length;
				if (match.index === 0) {
					this.label.className = this.label.className.substring(end);
				} else if (end === this.label.className.length) {
					this.label.className = this.label.className.substring(0, match.index);
				} else {
					this.label.className = [
								this.label.className.substring(match.index),
								this.label.className.substring(end)
							].join(" ");
				}
			}
		}
	};

	return self;
})();

/**
 * Valide un champ quelconque avec valeur non booléene.
 */
ageei.forms.ValueField_validate = function (event) {
	var field = event.getTarget();
	var vf = new ageei.forms.ValueField(field);
	
	if (field.value === "") {
		vf.flagEmpty();
	} else {
		vf.flagValid();
	}
};

/**
 * Réinitialise l'état de validité d'un champ quelconque avec valeur non
 * booléene.
 */
ageei.forms.ValueField_reset = function (field) {
	var vf = new ageei.forms.ValueField(field);
	
	if (field.value === "") {
		vf.removeValidityState();
	} else {
		vf.flagValid();
	}
};

/**
 * Valide une addresse de courriel.
 */
ageei.forms.EmailField_validate = function (event) {
	var field = event.getTarget();
	var vf = new ageei.forms.ValueField(field);
	
	if (field.value === "") {
		vf.flagEmpty();
	} else if (ageei.email.isValidAddress(field.value)) {
		vf.flagValid();
	} else {
		vf.flagInvalid();
	}
};

/**
 * Réinitialise l'état de validité d'une addresse de courriel.
 */
ageei.forms.EmailField_reset = function (field) {
	var vf = new ageei.forms.ValueField(field);
	
	if (field.value === "") {
		vf.removeValidityState();
	} else if (ageei.email.isValidAddress(field.value)) {
		vf.flagValid();
	} else {
		vf.flagInvalid();
	}
};

/**
 * Réinitialise l'état de validité d'un formulaire.
 */
ageei.forms.resetValidity = function (event) {
	var form = event.getTarget();
	var fields = form.getElementsByTagName("input");
	var field;
	var i;
	
	for (i = fields.length - 1; i >= 0; --i) {
		field = fields.item(i);
		switch (field.type) {
			case "email":
				ageei.forms.EmailField_reset(field);
				break;
			case "text":
				ageei.forms.ValueField_reset(field);
				break;
		}
	}
	fields = form.getElementsByTagName("select");
	for (i = fields.length - 1; i >= 0; --i) {
		field = fields.item(i);
		ageei.forms.ValueField_reset(field);
	}
};

ageei.forms.TextArea_focus = function (event) {
	event.getTarget().parentNode.className = "textarea-wrapper focus";
};

ageei.forms.TextArea_blur = function (event) {
	event.getTarget().parentNode.className = "textarea-wrapper focus";
};

/**
 * Un champ « Autre ».
 *
 * @param HtmlInputElement target le champ qui contrôle l’affichage du champ
 * « Autre » ou un champ du même nom.
 */
ageei.forms.OtherField = function (target) {
	var related;
	var j;

	/**
	 * @var HtmlInputElement le champ qui contrôle l’affichage du champ
	 * « Autre ».
	 */
	this.toggler = target;
	if (this.toggler.className !== "form-field-other-toggler"
			&& this.toggler.type === "radio") {
		related = document.getElementsByName(this.toggler.name);
		for (i = related.length - 1; i >= 0; --i) {
			if (related.item(i).className === "form-field-other-toggler") {
				this.toggler = related.item(i);
			}
		}
	}

	/**
	 * @var HtmlElement le champ « Autre ».
	 */
	this.field = document.getElementById(this.toggler.getAttribute("data-toggles"));
};

/**
 * Bascule (ou non) l’activation du champ « Autre » selon la
 * valeur du champ qui contrôle son activation.
 */
ageei.forms.OtherField_toggle = function (event) {
	var of = new ageei.forms.OtherField(event.getTarget());

	of.field.disabled = !of.toggler.checked;
};

/**
 * Réinitialise l’état d’activation des champ « Autre ».
 */
ageei.forms.OtherField_reset = function (event) {
	var of;
	var i;
	var togglers = ageei.dom.getElementsByClassName(event.getTarget(), "form-field-other-toggler", "input");

	for (i = togglers.length - 1; i >= 0; --i) {
		of = new ageei.forms.OtherField(togglers[i]);
		of.field.disabled = !ageei.dom.hasAttribute(of.toggler, "checked");
	}
};


////////////////////////////////////////////////////////////////////////////////
(function () {
	var addListener = ageei.dom.addListener;
	
	// Gestion du focus pour les TextArea.
	addListener(window, "load", function (event) {
		var textAreas = document.getElementsByTagName("textarea");
		var i;
		var field;
	
		for (i = textAreas.length - 1; i >= 0; --i) {
			field = textAreas.item(i);
			addListener(field, "focus", ageei.forms.TextArea_focus);
			addListener(field, "blur", ageei.forms.TextArea_blur);
		}
	});
	
	// Activation/désactiviation des champs « Autre ».
	addListener(window, "load", function (event) {
		var togglers = ageei.dom.getElementsByClassName(document, 
				"form-field-other-toggler", "input");
		var forms = document.getElementsByTagName("form");
		var of;
		var related;
		var i;
		var j;
		
		for (i = togglers.length - 1; i >= 0; --i) {
			of = new ageei.forms.OtherField(togglers[i]);
			of.field.disabled = !of.toggler.checked;

			if (of.toggler.type === "radio") {
				related = document.getElementsByName(of.toggler.name);
				for (j = related.length - 1; j >= 0; --j) {
					ageei.dom.addListener(related.item(j), "change",
							ageei.forms.OtherField_toggle);
				}
			} else {
				ageei.dom.addListener(of.toggler, "change",
						ageei.forms.OtherField_toggle);
			}
		}

		// Prendre en charge la réinitialisation du formulaire.
		// Notez que le formulaire peut, au chargement de la page, être
		// initialisé avec les valeurs précédement entrées, qui sont
		// différentes des valeurs qui seront mises suite à un évènement
		// `reset`, c’est-à-dire les valeurs des attributs (X)HTML.
		for (i = forms.length - 1; i >= 0; --i) {
			ageei.dom.addListener(forms.item(i), "reset",
					ageei.forms.OtherField_reset);
		}
	});

	// Validation des Input.
	addListener(window, "load", function (event) {
		var fields = document.getElementsByTagName("input");
		var forms = document.getElementsByTagName("form");
		var field;
		var i;
		
		for (i = fields.length - 1; i >= 0; --i) {
			field = fields.item(i);
			switch (field.type) {
				case "email":
					addListener(field, "blur", ageei.forms.EmailField_validate);
					break;
				case "text":
					addListener(field, "blur", ageei.forms.ValueField_validate);
					break;
			}
		}
		fields = document.getElementsByTagName("select");
		for (i = fields.length - 1; i >= 0; --i) {
			field = fields.item(i);
			addListener(field, "blur", ageei.forms.ValueField_validate);
		}
		
		for (i = forms.length - 1; i >= 0; --i) {
			ageei.dom.addListener(forms.item(i), "reset",
					ageei.forms.resetValidity);
		}
	});
})();
