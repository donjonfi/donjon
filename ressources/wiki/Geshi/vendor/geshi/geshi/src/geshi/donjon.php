<?php
/*************************************************************************************/
// Coloration syntaxique GeSHi pour le langage Donjon (.djn) => donjon.xax.be
// 
// Pour utiliser avec Dokuwiki :
//  - ajouter ce fichier dans « vendor/geshi/geshi/src/geshi/donjon.php ».
//  - ajouter dans le fichier « conf/usersstyle.css » le contenu suivant :
      // /* donjon overrides */
      // .code.donjon .br0 { color: #000000; }
      // .code.donjon .co1 { color: #7a7566;font-style: italic; }/* brun gris */
      // .code.donjon .co2 { color: #7a7566;font-style: italic; }/* brun gris */
      // .code.donjon .co3 { color: #668899;font-style: normal;}/* bleu */
      // .code.donjon .co4 { color: #668899;font-style: normal;}/* bleu */
      // .code.donjon .co5 { color: #668899;font-style: normal;}/* bleu */
      // .code.donjon .co6 { color: #668899;font-style: normal;}/* bleu */
      // .code.donjon .coMULTI { color: #ff0000; font-style: italic; }
      // .code.donjon .es0 { color: #ff0000; font-weight: bold; } 
      // .code.donjon .kw1 { color: #000000; font-weight: bold; } /* noir */
      // .code.donjon .kw2 { color: #3a693c; font-weight: bold; } /* vert */
      // .code.donjon .kw3 { color: #DD8855; font-weight: bold; } /* orange */
      // .code.donjon .kw4 { color: #AA5555; font-weight: bold; } /* rouge */
      // .code.donjon .kw5 { color: #674296; font-weight: bold; } /* violet */
      // .code.donjon .me1 { color: #00eeff; }
      // .code.donjon .me2 { color: #00eeff; }
      // .code.donjon .nu0 { color: #0000dd; }
      // .code.donjon .st0 { color: #668899; } /* bleu */
      // .code.donjon .sy0 { color: #000000; }
/*************************************************************************************/

$language_data = array (
    'LANG_NAME' => 'donjon',
    'COMMENT_SINGLE' => array(1 => "-- ", 2=> "REM"),
	// 'COMMENT_MULTI' => array('"' => '[', ']' => '[', ']' => '"'),
    'COMMENT_REGEXP' => array(
	    1 => '/(?:nowaynoway)/',
		2 => '/(?:nowainoway)/',
		3 => '/(?:"([^\]"]*?)\[)/',
		4 => '/(?:\]([^\["]*?)")/',
		5=> '/(?:\]([^"]*?)\[)/',
		6 => '/(?:"([^\]\["]*?)")/',
        ),
    'CASE_KEYWORDS' => GESHI_CAPS_NO_CHANGE,
    'QUOTEMARKS' => array('@'),
    'ESCAPE_CHAR' => array('\\'),
    'KEYWORDS' => array(
    /* Statements */
        1 => array(
			'attendre', 'changer', 'chercher', 'continuer(?!\:)', 'dire', 'refuser',
			'déplacer', 'effacer', 'stopper', 'terminer',
			'activer', 'désactiver', 'exécuter',
			'affecter', 'afficher', 'jouer', 'arrêter'
            ),
        2 => array(
			'objet',    'objets',    'lieu',      'lieux', 
			'élément',  'éléments',  'décor',     'décors', 
			'support',  'supports',  'contenant', 'contenants', 
			'obstacle', 'obstacles', 'porte',     'portes', 
			'vivant',   'vivants',   'animal',    'animaux', 
			'personne', 'personnes', 'homme',     'hommes',      'femme', 'femmes',
			'compteur', 'compteurs',
			'\daction',   '\dactions',   'question',  'questions',
			'liste', 'listes'
			
            ),
        3 => array(
            'si', 'sinon', 'sinonsi', 'choix', 'choisir', 'remplacer', 
			'avant', 'après', 'règle', 'action', 'routine',
			'phase', 'prérequis', 'exécution', 'épilogue',
			'définition', 'définitions',
			'peut', 'est', 'sont', 'pas', 'plus',
			'possède', 'possèdent', 'contient', 'contiennent', 'réagit', 'réagissent',
			'vaut', 'valent', 'augmente', 'augmentent', 'diminue', 'diminuent',
			'atteint', 'atteignent', 'dépasse', 'dépassent', 'se déclenche', 'se déclenchent',
			'ni', 'soit', 'ou', 'et', 'mais',
			'interpréter', 'comme',
			'initialement', 'puis', 'fin', 'finsi', 'finchoix', 'finchoisir',
      'prioritairement', 'progressivement',
			'choix', 'choisir', 'aucun', 'autre', 'boucle', 'hasard', 'fois'
            ),
        4 => array(
            'joueur', 'ceci', 'cela', 
			'celle-ci', 'celles-ci', 'celle-là', 'celles-là', 'celui-ci', 'ceux-ci', 'celui-là', 'ceux-là',
			'ici', 'règle', 
			'description','intitulé', 'texte', 'titre', 'réaction',
			'aperçu',
			'nom', 'pronom', 'accord', 'auteur', 'lien', 'licence', 'jeu'
            ),
		5 => array(
			'vers', 'au', 'en', 'sur', 'dans', 
			'nord', 'sud', 'ouest', 'haut', 'bas', 'dessus', 'dessous',
			'possédé(e)', 'visible', 'mangeable', 'buvable', 'porté(e)?', 'portable', 'disponible',
			'fermé', 'fermée', 'ouvert', 'ouverte', 'verrouillé', 'verrouillée',
			'initialisé', 'initialisée'
			)
        ),
    'SYMBOLS' => array(
        0 => array(
            '>','=','<','+','-','*','/','^','\\'
            ),
        1 => array(
            '@'
            )
        ),
    'CASE_SENSITIVE' => array(
            GESHI_COMMENTS => false,
            1 => false,
            2 => false,
            3 => false,
            4 => false,
			5 => false
            ),
    'STYLES' => array(
        'KEYWORDS' => array(
            1 => 'color: #668899;font-weight: bold',
            2 => 'color: #443344;font-weight: bold',
            3 => 'color: #DD8855;font-weight: bold',
            4 => 'color: #AA5555;font-weight: bold',
			5 => 'color: #AA5555;font-weight: bold'
            ),
        'COMMENTS' => array(
            1 => 'color: #29452b;',
            2 => 'color: #808080;'
            ),
        'BRACKETS' => array(
            0 => 'color: #66cc66;'
            ),
        'STRINGS' => array(
            0 => 'color: #151a3d;'
            ),
        'NUMBERS' => array(
            0 => 'color: #cc66cc;'
            ),
        'METHODS' => array(
            ),
        'SYMBOLS' => array(
        /* Same as KEYWORDS[3] (and, or, not...) */
            0 => 'color: #00a166;font-weight: bold',
            1 => 'color: #00a1a1;font-weight: bold',
            ),
        'ESCAPE_CHAR' => array(
            0 => 'color: #000099;'
            ),
        'SCRIPT' => array(
            ),
        'REGEXPS' => array(
            1 => 'color: #708090'
            )
        ),
    'URLS' => array(
        1 => '',
        2 => '',
        3 => '',
        4 => '',
        ),
    'OOLANG' => false,
    'OBJECT_SPLITTERS' => array(
        ),
    'REGEXPS' => array(
        1 => '^[0-9]+ '
        ),
    'STRICT_MODE_APPLIES' => GESHI_NEVER,
    'SCRIPT_DELIMITERS' => array(
        ),
    'HIGHLIGHT_STRICT_BLOCK' => array(
        )
);
