-- Compatible SQLite3
-- pragma foreign_keys = ON;

-- Une inscription au groupe.
create table Inscription (
	_id		Integer	primary key,	-- = rowid

	-- Date de la dernière modification.
	mdate	Date	not null,
	
	-- Nom
	last_name		Text,

	-- Prénom
	first_name		Text,

	-- Pseudonyme
	alias			Text,

	-- Addresse courriel
	email			Text,

	-- Dernière session prévue (AAAA-MM)
	last_semester	Date,

	-- Taille de chandail
	tshirt_size		Text,

	-- Régime alimentaire
	diet			Text
);

-- Allergies alimentaires ou intolérances sévères
create table FoodAllergy (
	_id Integer primary key,	-- = rowid
	Inscription_id Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Allergie
	item Text not null
);

-- Disponibilités
create table Availibility (
	_id Integer primary key,	-- = rowid
	Inscription_id Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Session (AAAA-MM)
	semester	Date	not null,

	-- Jour
	day			Text	not null,

	-- Période (heure de début)
	period		Number	not null
);

-- Intérêts
create table Interest (
	_id Integer primary key,	-- = rowid
	Inscription_id	Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Intérêt
	key				Text	not null,
	
	-- Rang (nombre négatif)
	interest_rank	Integer	not null
);

-- Compétence (général)
create table Skill (
	_id Integer primary key,	-- = rowid
	Inscription_id Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Champ de compétence
	key			Text	not null,
	
	-- Niveau de compétence (0 à 4)
	skill_level	Integer	not null
);

-- Niveaux de pratique (fréquence des activités)
create table Practice (
	_id Integer primary key,	-- = rowid
	Inscription_id Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Activité
	key			Text	not null,
	
	-- Niveau de pratique (0 à 4)
	practice_level	Integer	not null
);

-- Comptétence liguistique
create table Language_Skill (
	_id Integer primary key,	-- = rowid
	Inscription_id Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Langue
	key			Text	not null,
	
	-- Niveau de compétence
	-- Voir http://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages#Common_reference_levels
	skill_level	Text	not null
);

-- Participation à une compétition
create table Contest_Participation (
	_id Integer primary key,	-- = rowid
	Inscription_id Integer not null references Inscription(id) on delete cascade on update cascade,

	-- Compétition
	contest			Text	not null,

	-- Souhaite participer
	participation	Integer	not null,
	
	-- Disponible pour être responsable de chambre.
	available_for_checkin	Integer	not null
);

-- Idées
create table Contest_Ideas (
	_id Integer primary key,	-- = rowid

	-- Compétition
	contest			Text	not null,

	-- Catégorie d'idées
	category		Text,

	-- Contenu
	content			Text
);
