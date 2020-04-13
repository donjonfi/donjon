ace.define("ace/mode/donjon_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var DonjonHighlightRules = function () {

    var keywords = (
      "si|sinon|quand|avant|après|" +
      ""
    );

    var variableLanguage = (
      "joueur|inventaire|intitulé|description|capacité"
    );

    var builtinFunctions = (
      "dire|changer|remplacer|par|verrouiller|déverrouiller|ouvrir|fermer"
    );
    var builtinVariables = (
      "est|sont|vaut|contient|se|trouve|possède"
    );

    var keywordMapper = this.createKeywordMapper({
      "variable.language": variableLanguage,
      "support.function": builtinFunctions,
      // "support.variable": builtinVariables,
      "keyword": keywords,
      // "storage.type": storageType,
      "invalid.illegal": ("Ƶ|ƶ|Ʒ"),

    }, "identifier", true);

    this.$rules = {
      "start": [
        {
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
          regex: "(au (sud|nord))|(à l('|’)(ouest|est|intérieur|extérieur))|"
            + "ouvrable|ouvert(e?)|fermé(e?)|verrouillé(e?)|vide|plein(e?)"
        }, {
          token: "storage.type",
          regex: "une (salle|clé|porte|personne)|un (lieu|objet|animal|décor|contenant|nombre)|" +
            "des (salles|clés|portes|personnes|lieux|objets|animaux|décors|contenants|nombres)"
        }, {
          token: "support.variable",
          regex: "se (trouve)|est|sont|vaut|contient|possède"
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