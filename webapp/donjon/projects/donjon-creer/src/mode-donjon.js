ace.define("ace/mode/donjon_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var DonjonHighlightRules = function () {

    var variableLanguage = (
      "joueur|inventaire|historique|"
      + "intitulé|description|infinitif|préposition|titre|auteur|auteurs|aperçu|texte|lien|capacité|accord|réaction|version|licence|site|web|jeu|"
      + "aide|commande|action|contenu"
    );

    var builtinFunctions = (
      "dire|changer|déplacer|copier|effacer|sauver|remplacer|par|"
      + "verrouiller|déverrouiller|ouvrir|fermer|"
      + "stopper|continuer|terminer|exécuter|attendre|"
      + "|maintenant"
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
          token: "string", // multi line comment
          //regex : "\\/\\*",
          regex: '"|\\]',
          next: [
            {
              token: "string", // closing comment
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
          regex: "(\\b(désactiver|activer|quand|avant(?!\\;|\\.)|après(?!\\;|\\.)|si|sinon|sinonsi|fin si|finsi|refuser|(exécuter|terminer)(?! (l’|l'|la |le )?(action|commande|jeu))|interpréter|comme)\\b)|" +
            "(\\b(au hasard|en boucle|1ère fois|1ere fois|1re fois|[1-9][0-9]?e fois|[1-9][0-9]?ème fois|[1-9][0-9]?eme fois|initialement|prioritairement|puis|fin choix|finchoix)\\b)|" +
            "(\\b(mais pas|mais bien|mais ni|mais soit|mais plus|ainsi que|et|ou|ni|soit)\\b)|" +
            "(\\b(partie|chapitre|scène) )",
          caseInsensitive: true
        },
        {
          token: "constant.language",
          regex: "(au (sud|nord))|(au(\\-| )(dessus|dessous))|(en (haut|bas|dessous|dessus))|(à l('|’)(ouest|est|intérieur|extérieur))|sur |dans |sous |"
            + "(\\b(ceci|cela|ici|(la )?règle|(l’)?action|(la )?commande)\\b)|"
            + "(éteint(e)?(s)?(?!\\w))|"
            + "(\\b(quantitéCeci|quantitéCela|prépositionCeci|prépositionCela|(le )?nombre de)(?!\\w))|"
            
            + "(\\b("
            + "présent|absent|intact|déplacé|modifié|caché|couvert|décorati(f|v)|"
            + "dénombrable|indénombrable|mangeable|buvable|"
            + "ouvrable|ouvert|fermé|verrouillable|(dé)?verrouillé|clair|obscur|allumé|"
            + "marche|arrêt|parlant|opaque|transparent|fixé|transportable|"
            + "porté|possédé|disponible|occupé|"
            + "(in)?visible|(in)?accessible|ajdacent"
            + ")(e)?(s)?(?!\\w))"

        }, {
          token: "storage.type",
          // regex: "une (clé|porte|personne|action)|l('|’)action|la commande|un (lieu|objet|animal|décor|contenant|support|nombre)|" +
          regex: "une (clé|porte|personne|action)|un (lieu|objet|animal|décor|contenant|support|nombre)|" +
            "des (clés|portes|personnes|lieux|objets|animaux|décors|contenants|supports|nombres)"
        }, {
          // token: "support.variable",
          token: "variable.parameter",
          regex: "\\b((ne |n’|n')?(se |s’)?(est|sont|trouve(nt)?|déclenche(nt)?|vau(len)?t|diminue(nt)?|augmente(nt)?|attei(gne)?nt|dépasse(nt)?|contien(nen)?t|existe|possède(nt)?|porte(nt)?|réagi(ssen)?t|peu(ven)?t))\\b"
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