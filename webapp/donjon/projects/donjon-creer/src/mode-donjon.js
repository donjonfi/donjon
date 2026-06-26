ace.define("ace/mode/donjon_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var DonjonHighlightRules = function () {

    var variableLanguage = (
      "joueur|inventaire|"
      + "intitulé|Intitulé|pronom|Pronom|description|quantité|infinitif|préposition|titre|auteur|auteurs|"
      + "aperçu|texte|lien|capacité|accord|réaction|version|licence|site|web|jeu|"
      + "aide|commande|action|contenu|"
      + "musique|image|thème|sortie|sorties"
    );

    var builtinFunctions = (
      "afficher|ajouter|allumer|arrêter|attendre|augmenter|"
      + "changer|charger|consommer|continuer|copier|créer|creer|"
      + "décharger|déplacer|déterminer|déverrouiller|dire|diminuer|donner|"
      + "effacer|enlever|éteindre|exécuter|"
      + "fermer|jouer|lister|mémoriser|oublier|ouvrir|prendre|"
      + "refuser|remplacer|retirer|sauver|stopper|terminer|"
      + "verrouiller|vider"
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
          token: "string", // multi line string
          regex: '"|\\]',
          next: [
            {
              token: "string", // closing string
              regex: '"|\\[',
              next: "start"
            }, {
              defaultToken: "string"
            }
          ]
        }, {
          token: "string",           // " string
          regex: '".*?"'
        }, {
          token: "comment",
          regex: "--.*$"
        },
        {
          token: "keyword",
          regex: "(\\b(" +
            "désactiver|activer|" +
            "si|sinon|sinonsi|quand|non|" +
            "(autre )?choix|choisir( parmi)?|" +
            "phase (prérequis|exécution|épilogue)|" +
            "(exécuter|terminer)(?! (l’|l'|la |le )?(action|commande|jeu))|" +
            "interpréter|comme|implique|exclut|" +
            "forment une bascule|se contredisent|est un état)\\b" +
            ")|" +
            "(^(\\s*)inclure\\b)|" +
            "(\\b(au hasard|en boucle|1ère fois|1ere fois|1re fois|[1-9][0-9]?(e|ème|eme)? fois|initialement|prioritairement|progressivement|puis|fin (action|réaction(s)?|avant|après|si|choix|choisir|règle|routine)|fin(?=\])|finsi|finchoisir|finchoix)\\b)|" +
            "(\\b(mais (pas|bien|ni|soit|plus)|ainsi que|et( que)?|ou( que)?|ni|soit)\\b)|" +
            "(\\b(partie|chapitre|scène) )|" +
            "(\\b(il y a|exprimée?s? en)\\b)|(avec l('|’)unité)|" +
            "(\\b(principa(l|le|ux|les)|secondaires?|suppl(é|e)mentaires?|courantes?|compl(é|e)mentaires?|probables?|possibles?|masqu(é|e)es?)\\b)|" +
            "(^( )*(définition(s)?|basique)(?=( )*:))|" +
            "(^( )*(red(é|e)finir (l(’|')\\s*)?action|réaction(s)?|action|règle (avant|après|remplacer)|routine|concernant) (?=.+:$))"
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
            + "présent|absent|intact|déplacé|modifié|"
            + "mentionné|vu|famili(er|èr)|"
            + "secr(et|èt)|caché|discr(et|èt)|couvert|décorati(f|v)|"
            + "dénombrable|indénombrable|mangeable|buvable|"
            + "ouvrable|ouvert|fermé|verrouillable|(dé)?verrouillé|clair|obscur|allumé|"
            + "marche|arrêt|parlant|opaque|transparent|fixé|(trans)?portable|"
            + "solide|liquide|gazeu(x|s)|(im)?perméable|"
            + "enfilable|chaussable|"
            + "porté|enfilé|chaussé|possédé|disponible|occupé|"
            + "(in)?visible|(in)?accessible|adjacent|"
            + "initialisé|affiché|"
            + "multiple|unique|illimité|"
            + "cassé|actionné|connu|visité"
            + ")(e)?(s)?(?!\\w))|(équipé(e)?(s)?)|(équipable(s)?)"

        }, {
          token: "storage.type",
          // regex: "une (clé|porte|personne|action)|l('|’)action|la commande|un (lieu|objet|animal|décor|contenant|support|nombre)|" +
          regex: "une (clé|porte|personne|action|direction|liste|listevide|listenombre|listetexte|listeintitulé|listemixte|ressource)|un (obstacle|lieu|objet|animal|décor|contenant|support|vivant|compteur|concept|intitulé|élément)|" +
            "des (clés|portes|obstacles|personnes|lieux|objets|animaux|décors|contenants|supports|listes|compteurs|directions|vivants|concepts|intitulés|éléments|ressources)|" +
            "deux objets|" +
            "(l)('|’)(abréviation)|le synonyme|les synonymes"
        }, {
          // token: "support.variable",
          token: "variable.parameter",
          regex: "\\b((ne |n’|n')?(se |s’|s')?(?!l(’|'))(est|sont|trouve(nt)?|déclenche(nt)?|vau(len)?t|commence|diminue(nt)?|augmente(nt)?|attei(gne)?nt|dépasse(nt)?|contien(nen)?t|inclu(en)?t|existe|possède(nt)?|porte(nt)?|réagi(ssen)?t|peu(ven)?t))( pas| plus)?( par)?\\b"
        }, {
          token: "constant.numeric", // float
          regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
        }, {
          token: keywordMapper,
          regex: "[a-zA-Zàâäéèêëîïôöùûüÿçæœ_$][a-zA-Z0-9àâäéèêëîïôöùûüÿçæœ_$]*"
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

ace.define("ace/mode/donjon", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/text", "ace/mode/donjon_highlight_rules", "ace/mode/folding/fold_mode"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextMode = require("./text").Mode;
  var DonjonHighlightRules = require("./donjon_highlight_rules").DonjonHighlightRules;
  var BaseFoldMode = require("./folding/fold_mode").FoldMode;
  var Range = require("../range").Range;

  // ---------------------------------------------------------------------------
  // FOLD MODE — plie les blocs Donjon (règle, action, routine, si, choisir…)
  // et les bandeaux de séparation `-- =====`.
  // ---------------------------------------------------------------------------
  var DonjonFoldMode = function () { };
  oop.inherits(DonjonFoldMode, BaseFoldMode);

  (function () {
    this.foldOpenRegex = /^\s*(si\b.+:|sinonsi\b.+:|sinon\s*:|(autre\s+)?choix\b.*:|choisir(\s+parmi)?\b.*:|phase\s+(prérequis|exécution|épilogue)\s*:|(redéfinir\s+(l(’|')\s*)?action|réactions?|action|règle\s+(avant|après|remplacer)|routine|concernant|définitions?|basique)\b.*:)\s*$/i;
    this.foldCloseRegex = /^\s*(fin\s+(si|choix|choisir|action|réactions?|avant|après|remplacer|règle|routine)|finsi|finchoix|finchoisir)\b/i;
    this.sectionBanner = /^\s*--\s*=+\s*$/;

    this.getFoldWidget = function (session, foldStyle, row) {
      var line = session.getLine(row);
      if (this.foldOpenRegex.test(line)) return "start";
      if (this.sectionBanner.test(line)) return "start";
      return "";
    };

    this.getFoldWidgetRange = function (session, foldStyle, row) {
      var line = session.getLine(row);

      // Bandeau commentaire : plier jusqu'au prochain bandeau (ou fin).
      if (this.sectionBanner.test(line)) {
        var endRow = row + 1;
        var max = session.getLength();
        while (endRow < max && !this.sectionBanner.test(session.getLine(endRow))) endRow++;
        if (endRow > row + 1) {
          return new Range(row, line.length, endRow - 1, session.getLine(endRow - 1).length);
        }
        return null;
      }

      // Bloc : chercher la prochaine fermeture au même indent ou inférieur.
      if (this.foldOpenRegex.test(line)) {
        var startIndent = line.match(/^\s*/)[0].length;
        var maxRow = session.getLength();
        for (var r = row + 1; r < maxRow; r++) {
          var l = session.getLine(r);
          if (l.trim() === "") continue;
          var indent = l.match(/^\s*/)[0].length;
          if (this.foldCloseRegex.test(l) && indent <= startIndent) {
            return new Range(row, line.length, r, l.length);
          }
          // Bloc implicitement fermé par un autre bloc de même niveau (action suivante…).
          if (this.foldOpenRegex.test(l) && indent <= startIndent) {
            return new Range(row, line.length, r - 1, session.getLine(r - 1).length);
          }
        }
      }
      return null;
    };
  }).call(DonjonFoldMode.prototype);

  // ---------------------------------------------------------------------------
  // MODE
  // ---------------------------------------------------------------------------
  var Mode = function () {
    this.HighlightRules = DonjonHighlightRules;
    this.foldingRules = new DonjonFoldMode();
    this.$behaviour = this.$defaultBehaviour;
  };
  oop.inherits(Mode, TextMode);

  (function () {

    this.lineCommentStart = "--";

    // -- Indentation contextuelle ---------------------------------------------
    this.$ouvertureBlocRegex = new RegExp(
      "^(" +
        "si\\b.+:\\s*$|sinonsi\\b.+:\\s*$|sinon\\s*:\\s*$|" +
        "(autre\\s+)?choix\\b.*:\\s*$|choisir(\\s+parmi)?\\b.*:\\s*$|" +
        "phase\\s+(prérequis|exécution|épilogue)\\s*:\\s*$|" +
        "(redéfinir\\s+(l(’|')\\s*)?action|réactions?|action|règle\\s+(avant|après|remplacer)|routine|concernant|définitions?|basique)\\b.*:\\s*$" +
      ")",
      "i"
    );
    this.$fermetureBlocRegex = /^(fin\s+(si|choix|choisir|action|réactions?|avant|après|remplacer|règle|routine)|finsi|finchoix|finchoisir)\b/i;

    this.getNextLineIndent = function (state, line, tab) {
      var indent = this.$getIndent(line);
      if (this.$ouvertureBlocRegex.test(line.trim())) {
        indent += tab;
      }
      return indent;
    };

    this.checkOutdent = function (state, line, input) {
      if (input !== "\n" && input !== "\r\n" && input !== "\r") return false;
      return this.$fermetureBlocRegex.test(line.trim());
    };

    this.autoOutdent = function (state, doc, row) {
      var line = doc.getLine(row);
      var tab = doc.getTabString();
      var currIndent = this.$getIndent(line);
      if (currIndent.endsWith(tab)) {
        doc.replace(new Range(row, 0, row, tab.length), "");
      }
    };

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