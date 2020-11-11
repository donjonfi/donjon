ace.define("ace/mode/donjon_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var DonjonHighlightRules = function () {

    var variableLanguage = (
      "joueur|inventaire|historique|"
      + "intitulé|description|aperçu|capacité|accord|réaction|"
      + "contenu"
    );

    var builtinFunctions = (
      "dire|changer|déplacer|effacer|sauver|remplacer|par|"
      + "verrouiller|déverrouiller|ouvrir|fermer|"
      + "stopper|continuer|"
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
          regex: "^( |)--.*$"
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
          regex: "quand |avant |après |si |sinon|fin si|refuser |exécuter |terminer |interpréter |comme |" +
            "au hasard|en boucle|1ère fois|[1-9][0-9]?e fois|initialement|puis|fin choix|" +
            "et\\b|ou\\b|ni\\b|soit\\b|mais pas|" +
            "partie|chapitre|scène",
          caseInsensitive: true
        },
        {
          token: "constant.language",
          regex: "(au (sud|nord))|(à l('|’)(ouest|est|intérieur|extérieur))|sur |dans |"
            // + "vide(s)?|plein(e)?(s)?|"
            + "((présent|absent|intact|déplacé|modifié|caché|couvert|invisible|décorati(f|v)|"
            + "dénombrable|indénombrable|mangeable|buvable|"
            + "ouvrable|ouvert|fermé|verrouillable|(dé)?verrouillé|clair|obscur|allumé|éteint|"
            + "marche|arrêt|parlant|opaque|transparent|fixé|transportable)(e)?(s)?)|"
            + "ceci|cela|ici|"
            + "visible(s)?|accessible(s)?|"
            + "(porté|possédé|disponible|occupé)(e)?(s)?"
        }, {
          token: "storage.type",
          regex: "une (clé|porte|personne|action)|un (lieu|objet|animal|décor|contenant|support|nombre)|" +
            "des (clés|portes|personnes|lieux|objets|animaux|décors|contenants|supports|nombres)"
        }, {
          // token: "support.variable",
          token: "variable.parameter",
          regex: "se (trouve)|n(’|')est pas|n(’|')est plus|est|sont|vaut|contient|possède|réagit|réagissent|peut"
        }, {
          token: "constant.numeric", // float
          regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
        }, {
          token: keywordMapper,
          regex: "[a-zA-Zéèàêç_$][a-zA-Z0-9éèàç_$]*"
        }, {
          token: "keyword.operator",
          regex: "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|="
        }, {
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