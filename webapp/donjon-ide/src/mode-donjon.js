ace.define("ace/mode/donjon_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var DonjonHighlightRules = function () {

    var keywords = (
      "si|sinon|quand|remplacer|par|avant|après|" +
      "est|sont|vaut|contient|se|trouve"
    );

    var variableLanguage = (
      "joueur|inventaire|intitulé|description|capacité"
    );

    var builtinFunctions = (
      "dire"
    );
    var builtinVariables = (
      ""
    );

    var storageType = (
      "salle|salles|lieu|lieux|" +
      "porte|portes|clé|clés|" +
      "objet|objets|animal|animaux|personne|personnes|décor|décors|contenant|" +
      "nombre"
    );

    var keywordMapper = this.createKeywordMapper({
      "variable.language": variableLanguage,
      "support.function": builtinFunctions,
      "support.variable": builtinVariables,
      "keyword": keywords,
      "storage.type": storageType,
      "invalid.illegal": ("🚦|🏁|↪"),

    }, "identifier", true);

    this.$rules = {
      "start": [{
        token: "comment",
        regex: "--.*$"
      }, {
        token: "comment",
        start: "/\\*",
        end: "\\*/"
      }, {
        token: "string", // multi line comment
        //regex : "\\/\\*",
        regex: '"',
        next: "string"
      }, {
        token: "string",           // " string
        regex: '".*?"'
      }, {
        token: "constant.language",
        regex: "\\.|;|au sud|au nord|à l’ouest|à l'ouest|à l’est|à l'est|à l’intérieur|à l'intérieur|à l’extérieur|à l'extérieur|"
          + "ouvrable|ouvert|ouverte|fermé|fermée|vide|plein"
      }, {
        token: "constant.numeric", // float
        regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
      }, {
        token: keywordMapper,
        // regex : "[a-zA-Zéè_$][a-zA-Z0-9éè_$]*\\b"
        regex: "[a-zA-Zéèàê_$][a-zA-Z0-9éèà_$]*"
      }, {
        token: "keyword.operator",
        regex: "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|=|pas"
      }, {
        token: "paren.lparen",
        regex: "[\\(]"
      }, {
        token: "paren.rparen",
        regex: "[\\)]"
      }, {
        token: "text",
        regex: "\\s+"
      }],
      "string": [
        {
          token: "string", // closing comment
          //regex : "\\*\\/",
          regex: '"',
          next: "start"
        }, {
          defaultToken: "string"
        }
      ]
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