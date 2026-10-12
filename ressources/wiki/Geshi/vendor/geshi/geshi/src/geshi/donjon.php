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
    'ESCAPE_CHAR' => '\\',
    'KEYWORDS' => array(
    /* Statements */
        1 => array(
			'attendre', 'changer', 'continuer(?!\:)', 'dire', 'refuser',
			'déplacer', 'effacer', 'stopper', 'terminer',
			'activer', 'désactiver', 'exécuter',
			'afficher', 'jouer', 'arrêter',
			'ajouter', 'allumer', 'charger', 'copier',
			'décharger', 'déterminer', 'déverrouiller', 'donner',
			'enlever', 'éteindre', 'fermer',
			'lister', 'mémoriser', 'oublier', 'ouvrir', 'prendre',
			'retirer', 'sauver', 'vider', 'verrouiller',
			'annuler', 'commencer', 'consommer', 'créer', 'interrompre', 'sélectionner', 'tester'
            ),
        2 => array(
            'clé',      'clés',      'direction', 'directions',
			'objet',    'objets',    'lieu',      'lieux',
			'élément',  'éléments',  'décor',     'décors',
			'support',  'supports',  'contenant', 'contenants',
			'obstacle', 'obstacles', 'porte',     'portes',
			'vivant',   'vivants',   'animal',    'animaux',
			'personne', 'personnes',
			'compteur', 'compteurs',
			'concept',  'concepts',  'intitulé',  'intitulés',
			'ressource', 'ressources',
			'liste',    'listes',
			'listevide', 'listenombre', 'listetexte', 'listeintitulé', 'listemixte'
            ),
        3 => array(
            'si', 'sinon', 'sinonsi', 'choix', 'choisir', 'remplacer',
			'avant', 'après', 'règle', 'action', 'réaction', 'réactions', 'basique', 'concernant', 'routine',
			'redéfinir', 'redefinir',
			'phase', 'prérequis', 'exécution', 'épilogue',
			'définition', 'définitions',
			'probable', 'probables', 'possible', 'possibles',
			'prépositions',
			'masquée', 'masquées', 'masquee', 'masquees',
			'inclure', 'quand',
			'est', 'sont', 'pas', 'plus', 'non', 'se trouve', 'se trouvent',
            'contient', 'contiennent',
			'possède', 'possèdent', 'porte', 'portent',
            'réagit', 'réagissent', 'peut', 'peuvent',
			'vaut', 'valent', 'commence par', 'commencent par',
			'existe', 'existent', 'inclut', 'incluent',
            'augmente', 'augmentent', 'diminue', 'diminuent',
			'atteint', 'atteignent', 'dépasse', 'dépassent', 'se déclenche', 'se déclenchent',
			'implique', 'exclut',
			'ni', 'soit', 'ou', 'et', 'mais', 'ainsi que',
			'forment une bascule', 'se contredisent',
			'il y a', 'exprimé en', 'exprimée en', 'exprimés en', 'exprimées en',
			'avec l\'unité', 'avec l’unité',
			'interpréter', 'comme',
			'initialement', 'puis', 'fin', 'finsi', 'finchoix', 'finchoisir',
      'prioritairement', 'progressivement',
			'partie', 'chapitre', 'scène',
			'choix', 'choisir', 'parmi', 'aucun', 'aucune', 'autre', 'boucle', 'hasard', 'fois',
			// interface tactile : actions courantes / complémentaires (+ anciens principales / secondaires / supplémentaires)
			'principal', 'principale', 'principaux', 'principales',
			'secondaire', 'secondaires', 'supplémentaire', 'supplémentaires',
			'courante', 'courantes', 'complémentaire', 'complémentaires'
            ),
        4 => array(
            'joueur', 'inventaire', 'ceci', 'cela',
			'celle-ci', 'celles-ci', 'celui-ci', 'ceux-ci',
			'ici', 'règle',
			'quantitéCeci', 'quantitéCela', 'prépositionCeci', 'prépositionCela',
			'origine', 'destination', 'orientation', 'réponse',
			'description','intitulé', 'texte', 'titre', 'réaction',
			'aperçu', 'aide', 'commande', 'contenu',
			'quantité', 'infinitif', 'préposition', 'capacité',
			'version', 'site', 'web', 'auteur', 'auteurs', 'licence', 'jeu',
			'musique', 'image', 'thème', 'sortie', 'sorties',
			'pronom', 'accord', 'lien'
            ),
		5 => array(
			'vers', 'au', 'en', 'sur', 'dans', 'sous',
			'nord', 'sud', 'ouest', 'haut', 'bas', 'dessus', 'dessous',
			'intérieur', 'extérieur',
			// états de base et personnalisés
			'présent', 'présente', 'absent', 'absente',
			'intact', 'intacte', 'déplacé', 'déplacée', 'modifié', 'modifiée',
			'mentionné', 'mentionnée', 'vu', 'vue', 'vus', 'vues',
			'familier', 'familière', 'couvert', 'couverte',
			'décoratif', 'décorative', 'secret', 'secrète',
			'caché', 'cachée', 'discret', 'discrète',
			'dénombrable', 'indénombrable',
			'mangeable', 'buvable',
			'ouvrable', 'ouvert', 'ouverte', 'fermé', 'fermée',
			'verrouillable', 'verrouillé', 'verrouillée', 'déverrouillé', 'déverrouillée',
			'clair', 'claire', 'obscur', 'obscure',
			'allumé', 'allumée', 'éteint', 'éteinte',
			'marche', 'arrêt', 'arrêté', 'arrêtée',
			'parlant', 'parlante', 'opaque', 'transparent', 'transparente',
			'fixé', 'fixée',
			'portable', 'transportable', 'porté', 'portée',
			'solide', 'liquide', 'gazeux', 'gazeuse',
			'perméable', 'imperméable',
			'enfilable', 'équipable', 'chaussable',
			'enfilé', 'enfilée', 'équipé', 'équipée', 'chaussé', 'chaussée',
			'possédé', 'possédée', 'disponible', 'occupé', 'occupée',
			'visible', 'invisible', 'accessible', 'inaccessible',
			'adjacent', 'adjacente',
			'initialisé', 'initialisée',
			'multiple', 'unique', 'illimité', 'illimitée',
			'cassé', 'cassée', 'actionné', 'actionnée',
			'connu', 'connue', 'visité', 'visitée',
			'affiché', 'affichée'
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
    'PARSER_CONTROL' => array(
        'KEYWORDS' => array(
            'DISALLOWED_BEFORE' => '(?<![a-zA-Z0-9_\x7f-\xff])',
            'DISALLOWED_AFTER' => '(?![a-zA-Z0-9_\x7f-\xff])'
            )
        ),
    'STRICT_MODE_APPLIES' => GESHI_NEVER,
    'SCRIPT_DELIMITERS' => array(
        ),
    'HIGHLIGHT_STRICT_BLOCK' => array(
        )
);
