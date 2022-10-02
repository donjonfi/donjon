ace.define("ace/mode/donjon_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var DonjonHighlightRules = function () {

    var variableLanguage = (
      "joueur|inventaire|"
      + "intitulé|description|infinitif|préposition|titre|auteur|auteurs|"
      + "aperçu|texte|lien|capacité|accord|réaction|version|licence|site|web|jeu|"
      + "aide|commande|action|contenu|"
      + "musique|image|thème"
    );

    var builtinFunctions = (
      "attendre|changer|continuer|copier|déplacer|déverrouiller|"
      + "dire|effacer|exécuter|remplacer|"
      + "refuser|sauver|stopper|terminer|"
      + "jouer|arrêter|afficher|décharger|charger|déterminer|"
      + "vider"
    );

    var keywordMapper = this.createKeywordMapper({
      "variable.language": variableLanguage,
      "support.function": builtinFunctions,
      // "support.variable": builtinVariables,
      // "keyword": keywords,
      // "storage.type": storageType,
      "invalid": ("Ƶ|ƶ|Ʒ"),

    }, "identifier", true);

    this.$rules = {
      "start": [
        {
          token: "comment",
          regex: "^( *)--.*$"
        }, {
          token: "comment",
          start: "/\\*",
          end: "\\*/"
        }, {
          token: "string", // multi line string
          //regex : "\\/\\*",
          regex: '"|\\]',
          next: [
            {
              token: "string", // closing string
              //regex : "\\*\\/",
              regex: '"|\\[',
              next: "start"
            }, {
              defaultToken: "string"
            }
          ]
        }, {
          token: "string",           // " string
          regex: '".*?"'
        },
        {
          token: "keyword",
          regex: "(\\b(" +
            "désactiver|activer|" +
            "si|sinon|sinonsi|" +
            "(autre )?choix|choisir( parmis)?|" +
            "phase (prérequis|exécution|épilogue)|" +
            "(exécuter|terminer)(?! (l’|l'|la |le )?(action|commande|jeu))|" +
            "interpréter|comme)\\b" +
            ")|" +
            "(\\b(au hasard|en boucle|1ère fois|1ere fois|1re fois|[1-9][0-9]?(e|ème|eme)? fois|initialement|prioritairement|progressivement|puis|fin (action|réaction(s)?|avant|après|si|choix|choisir|règle|routine)|finsi|finchoisir|finchoix)\\b)|" +
            "(\\b(mais (pas|bien|ni|soit|plus)|ainsi que|et( que)?|ou( que)?|ni|soit)\\b)|" +
            "(\\b(partie|chapitre|scène) )|" +
            "(^( )*(définition(s)?|basique)(?=( )*:))|" +
            "(^( )*(réaction(s)?|action|règle (avant|après)|routine|concernant) (?=.+:$))"
          ,
          caseInsensitive: true
        },
        {
          token: "constant.language",
          regex: "(au (sud|nord)(?:-(?:est|ouest))?)|(au(\\-| )(dessus|dessous))|(en (haut|bas|dessous|dessus))|(à l('|’)(ouest|est|intérieur|extérieur))|sur |dans |sous |"
            + "(\\b(ceci|cela|ici|celui-ci|celle-ci|ceux-ci|celles-ci|réponse|origine|destination|orientation|(la )?règle|(l’)?action|(la )?commande)\\b)|"
            + "(éteint(e)?(s)?(?!\\w))|"
            + "(\\b(quantitéCeci|quantitéCela|prépositionCeci|prépositionCela|(le )?nombre de)(?!\\w))|"

            + "(\\b("
            + "présent|absent|intact|déplacé|modifié|caché|couvert|décorati(f|v)|"
            + "dénombrable|indénombrable|mangeable|buvable|"
            + "ouvrable|ouvert|fermé|verrouillable|(dé)?verrouillé|clair|obscur|allumé|"
            + "marche|arrêt|parlant|opaque|transparent|fixé|(trans)?portable|"
            + "enfilable|chaussable|"
            + "porté|enfilé|chaussé|possédé|disponible|occupé|"
            + "(in)?visible|(in)?accessible|ajdacent|"
            + "multiple|unique|illimité"
            + ")(e)?(s)?(?!\\w))|(équipé(e)?(s)?)|(équipable(s)?)"

        }, {
          token: "storage.type",
          // regex: "une (clé|porte|personne|action)|l('|’)action|la commande|un (lieu|objet|animal|décor|contenant|support|nombre)|" +
          regex: "une (clé|porte|personne|action|direction|liste)|un (obstacle|lieu|objet|animal|décor|contenant|support|compteur)|" +
            "des (clés|portes|obstacles|personnes|lieux|objets|animaux|décors|contenants|supports|listes|compteurs)|" +
            "(l)('|’)(abréviation)|le synonyme|les synonymes"
        }, {
          // token: "support.variable",
          token: "variable.parameter",
          regex: "\\b((ne |n’|n')?(se |s’|s')?(?!l(’|'))(est|sont|trouve(nt)?|déclenche(nt)?|vau(len)?t|diminue(nt)?|augmente(nt)?|attei(gne)?nt|dépasse(nt)?|contien(nen)?t|inclu(en)?t|existe|possède(nt)?|porte(nt)?|réagi(ssen)?t|peu(ven)?t))\\b"
        }, {
          token: "constant.numeric", // float
          regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
        }, {
          token: keywordMapper,
          regex: "[a-zA-Zéèàêç_$][a-zA-Z0-9éèàêç_$]*"
        },

        // {
        //   token: "keyword.operator",
        //   regex: "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|="
        // }, 

        {
          token: "paren.lparen",
          regex: "[\\(]"
        }, {
          token: "paren.rparen",
          regex: "[\\)]"
        }, {
          token: "text",
          regex: "\\s+"
        }]
    };
    this.normalizeRules();
  };

  oop.inherits(DonjonHighlightRules, TextHighlightRules);

  exports.DonjonHighlightRules = DonjonHighlightRules;
});

ace.define("ace/mode/donjon", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/jon_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextMode = require("./text").Mode;
  var DonjonHighlightRules = require("./donjon_highlight_rules").DonjonHighlightRules;

  var Mode = function () {
    this.HighlightRules = DonjonHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
  };
  oop.inherits(Mode, TextMode);

  (function () {

    this.lineCommentStart = "--";

    this.$id = "ace/mode/donjon";
    //this.snippetFileId = "ace/snippets/donjon";
  }).call(Mode.prototype);

  exports.Mode = Mode;

});
/*
(function() {
  ace.require(["ace/mode/donjon"], function(m) {
    if (typeof module == "object" && typeof exports == "object" && module) {
      module.exports = m;
    }
  });
})();
*/