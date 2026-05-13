"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const declarationScanner_1 = require("./declarationScanner");
function byKind(decls, kind) {
    return decls.filter((d) => d.kind === kind);
}
function names(decls) {
    return decls.map((d) => d.name);
}
(0, node_test_1.describe)('findDeclarations — instances (article défini)', () => {
    (0, node_test_1.it)('détecte « Le X est un Y »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Le portefeuille est un compteur initialisé à 15.'), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'portefeuille');
        strict_1.default.equal(decls[0].displayName, 'portefeuille');
        strict_1.default.equal(decls[0].parent, 'compteur');
    });
    (0, node_test_1.it)('détecte « La X est une Y »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('La saucisse est une charcuterie.'), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'saucisse');
        strict_1.default.equal(decls[0].parent, 'charcuterie');
    });
    (0, node_test_1.it)('détecte « Les X sont des Y »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Les pommes sont des fruits.'), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'pommes');
        strict_1.default.equal(decls[0].parent, 'fruits');
    });
    (0, node_test_1.it)("détecte l'article élidé « L'X est … »", () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)("L'horloge est un objet dans le salon."), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'horloge');
        strict_1.default.equal(decls[0].parent, 'objet');
    });
    (0, node_test_1.it)('détecte le suffixe de genre « (f) »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)("L'apicultrice (f) est une personne dans la boutique."), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'apicultrice');
        strict_1.default.equal(decls[0].parent, 'personne');
    });
    (0, node_test_1.it)('gère les noms multi-mots', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Le pot de miel est un objet sur la table.'), 'variable');
        const found = decls.find((d) => d.name === 'pot de miel');
        strict_1.default.ok(found, 'pot de miel doit être détecté');
        strict_1.default.equal(found.parent, 'objet');
    });
    (0, node_test_1.it)("expose les positions name/declaration cohérentes", () => {
        const text = 'Le boucher est une personne.';
        const decl = byKind((0, declarationScanner_1.findDeclarations)(text), 'variable')[0];
        strict_1.default.equal(text.slice(decl.nameStart, decl.nameEnd), 'boucher');
        strict_1.default.equal(text.slice(decl.declarationStart, decl.declarationEnd).trim().startsWith('Le boucher'), true);
    });
});
(0, node_test_1.describe)('findDeclarations — instances (nom propre, sans article)', () => {
    (0, node_test_1.it)('détecte « Céline (f) est une personne dans le salon. »', () => {
        const text = 'Céline (f) est une personne dans le salon.';
        const decls = byKind((0, declarationScanner_1.findDeclarations)(text), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'céline');
        strict_1.default.equal(decls[0].displayName, 'Céline');
        strict_1.default.equal(decls[0].parent, 'personne');
        strict_1.default.equal(text.slice(decls[0].nameStart, decls[0].nameEnd), 'Céline');
    });
    (0, node_test_1.it)('détecte un nom propre sans suffixe de genre', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Élise est une magicienne.'), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'élise');
        strict_1.default.equal(decls[0].parent, 'magicienne');
    });
    (0, node_test_1.it)('gère un nom propre composé avec trait d’union', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Jean-Pierre est un voisin.'), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'jean-pierre');
        strict_1.default.equal(decls[0].displayName, 'Jean-Pierre');
        strict_1.default.equal(decls[0].parent, 'voisin');
    });
    (0, node_test_1.it)('gère un nom propre avec apostrophe', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)("D'Artagnan est un mousquetaire."), 'variable');
        const found = decls.find((d) => d.name === "d'artagnan");
        strict_1.default.ok(found, "D'Artagnan doit être détecté");
        strict_1.default.equal(found.parent, 'mousquetaire');
    });
    (0, node_test_1.it)('gère un nom propre composé avec espace', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Marie Curie est une physicienne.'), 'variable');
        const found = decls.find((d) => d.name === 'marie curie');
        strict_1.default.ok(found, 'Marie Curie doit être détecté');
        strict_1.default.equal(found.parent, 'physicienne');
    });
    (0, node_test_1.it)("ne double pas une déclaration déjà introduite par un article défini", () => {
        // « Le bouton est un objet. » commence par une majuscule (« Le »), mais
        // est déjà couvert par INSTANCE_DECLARATION : un seul match attendu.
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Le bouton est un objet.'), 'variable');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'bouton');
    });
    (0, node_test_1.it)('ne déclenche pas sur une amorce de type indéfini', () => {
        // « Un sac est un contenant. » reste un type ; la regex nom propre est
        // bloquée par le lookahead négatif sur « Un\s ».
        const variables = byKind((0, declarationScanner_1.findDeclarations)('Un sac est un contenant.'), 'variable');
        strict_1.default.equal(variables.length, 0);
    });
    (0, node_test_1.it)('détecte les occurrences ultérieures d’un nom propre', () => {
        const text = `Céline (f) est une personne dans le salon.
Céline porte un chapeau.
le joueur regarde céline.`;
        const decls = (0, declarationScanner_1.findDeclarations)(text);
        const occurrences = (0, declarationScanner_1.findOccurrences)(text, decls);
        const celineOcc = occurrences.filter((o) => o.name === 'céline');
        // 1 dans la déclaration + 2 dans le corps = 3 occurrences au moins
        strict_1.default.ok(celineOcc.length >= 3, `attendu ≥ 3 occurrences, reçu ${celineOcc.length}`);
        strict_1.default.ok(celineOcc.every((o) => o.kind === 'variable'));
    });
});
(0, node_test_1.describe)('findDeclarations — types (article indéfini)', () => {
    (0, node_test_1.it)('détecte « Un X est un Y »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Un sac est un contenant.'), 'type');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'sac');
        strict_1.default.equal(decls[0].parent, 'contenant');
    });
    (0, node_test_1.it)('détecte « Une X est une Y »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('Une charcuterie est une nourriture.'), 'type');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'charcuterie');
    });
    (0, node_test_1.it)('priorise « instance » sur « type » homonyme dans les occurrences', () => {
        const text = `Un fruit est un objet.
La pomme est un fruit.
Le boucher mange la pomme.`;
        const decls = (0, declarationScanner_1.findDeclarations)(text);
        strict_1.default.ok(byKind(decls, 'type').some((d) => d.name === 'fruit'));
        strict_1.default.ok(byKind(decls, 'variable').some((d) => d.name === 'pomme'));
        const occurrences = (0, declarationScanner_1.findOccurrences)(text, decls);
        const pomme = occurrences.filter((o) => o.name === 'pomme');
        strict_1.default.ok(pomme.length >= 2, 'pomme doit avoir plusieurs occurrences');
        strict_1.default.ok(pomme.every((o) => o.kind === 'variable'));
    });
});
(0, node_test_1.describe)('findDeclarations — routines', () => {
    (0, node_test_1.it)('détecte « routine X: »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('routine ContenuPortefeuille:'), 'routine');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'contenuportefeuille');
        strict_1.default.equal(decls[0].displayName, 'ContenuPortefeuille');
    });
    (0, node_test_1.it)('ignore les noms à plusieurs mots après « routine »', () => {
        // les routines sont identifiées par un identifiant simple, pas une phrase
        const decls = byKind((0, declarationScanner_1.findDeclarations)('routine Pas Assez:'), 'routine');
        // « Pas » est un identifiant valide ; tout ce qui suit est ignoré jusqu'à `:`
        // donc on doit avoir une routine nommée « Pas » (single-word)
        strict_1.default.equal(decls.length, 0, 'pas de match si le nom contient un espace avant `:`');
    });
});
(0, node_test_1.describe)('findDeclarations — actions', () => {
    (0, node_test_1.it)('détecte « action verbe: » (0 arg)', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('action manger:'), 'action');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'manger');
    });
    (0, node_test_1.it)('détecte « action verbe ceci: » (1 arg)', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('action manger ceci:'), 'action');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'manger ceci');
    });
    (0, node_test_1.it)('détecte « action verbe ceci avec cela: » (2 args avec prép)', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('action mettre ceci avec cela:'), 'action');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'mettre ceci avec cela');
    });
    (0, node_test_1.it)('détecte « action verbe ceci concernant cela: »', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('action interroger ceci concernant cela:'), 'action');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'interroger ceci concernant cela');
    });
    (0, node_test_1.it)('normalise les espaces multiples', () => {
        const decls = byKind((0, declarationScanner_1.findDeclarations)('action  mettre   ceci   avec   cela  :'), 'action');
        strict_1.default.equal(decls.length, 1);
        strict_1.default.equal(decls[0].name, 'mettre ceci avec cela');
    });
});
(0, node_test_1.describe)('findDeclarations — masquage des commentaires et chaînes', () => {
    (0, node_test_1.it)('ignore les déclarations dans un commentaire', () => {
        const decls = (0, declarationScanner_1.findDeclarations)('-- Le boucher est une personne.');
        strict_1.default.equal(decls.length, 0);
    });
    (0, node_test_1.it)('ignore les déclarations dans une chaîne', () => {
        const decls = (0, declarationScanner_1.findDeclarations)('dire "Le boucher est une personne.".');
        strict_1.default.equal(decls.length, 0);
    });
    (0, node_test_1.it)("ignore les chaînes multi-lignes", () => {
        const text = `dire "première ligne
Le boucher est une personne.
deuxième ligne".`;
        strict_1.default.equal((0, declarationScanner_1.findDeclarations)(text).length, 0);
    });
});
(0, node_test_1.describe)('findOccurrences — instances et types', () => {
    (0, node_test_1.it)('reconnaît une instance après son article (peu importe le déterminant)', () => {
        const text = `Le boucher est une personne.
Le joueur parle au boucher.
La conversation avec le boucher est animée.`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const bouchers = occ.filter((o) => o.name === 'boucher');
        strict_1.default.equal(bouchers.length, 3);
        strict_1.default.ok(bouchers.every((b) => b.kind === 'variable'));
    });
    (0, node_test_1.it)('ne reconnaît pas un mot dans un commentaire', () => {
        const text = `Le boucher est une personne.
-- bla bla boucher`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        strict_1.default.equal(occ.filter((o) => o.name === 'boucher').length, 1);
    });
    (0, node_test_1.it)('ne reconnaît pas un mot dans une chaîne', () => {
        const text = `Le boucher est une personne.
dire "Le boucher est gentil".`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        strict_1.default.equal(occ.filter((o) => o.name === 'boucher').length, 1);
    });
    (0, node_test_1.it)('respecte les frontières de mots Unicode', () => {
        const text = `Le sac est un contenant.
Le sacrement est en jeu.`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        // « sac » ne doit PAS matcher dans « sacrement »
        const sacs = occ.filter((o) => o.name === 'sac');
        strict_1.default.equal(sacs.length, 1);
    });
});
(0, node_test_1.describe)('findOccurrences — routines', () => {
    (0, node_test_1.it)('reconnaît « exécuter la routine X »', () => {
        const text = `routine ContenuPortefeuille:
    dire "ok".
fin routine

règle après afficher l’inventaire:
    exécuter la routine ContenuPortefeuille.
fin règle`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const refs = occ.filter((o) => o.kind === 'routine' && o.name === 'contenuportefeuille');
        strict_1.default.equal(refs.length, 1);
    });
    (0, node_test_1.it)('reconnaît « exécuter routine X » (sans « la »)', () => {
        const text = `routine PasAssez:
    dire "non".
fin routine

action commencer:
    exécuter routine PasAssez.
fin action`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        strict_1.default.equal(occ.filter((o) => o.kind === 'routine').length, 1);
    });
    (0, node_test_1.it)("ignore une référence à une routine inconnue", () => {
        const text = `exécuter la routine Inexistante.`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        strict_1.default.equal(occ.length, 0);
    });
});
(0, node_test_1.describe)('findOccurrences — actions', () => {
    (0, node_test_1.it)('match exact 0-arg', () => {
        const text = `action regarder:
    dire "regard".
fin action

routine X:
    exécuter l'action regarder.
fin routine`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const actions = occ.filter((o) => o.kind === 'action');
        strict_1.default.equal(actions.length, 1);
        strict_1.default.equal(actions[0].name, 'regarder');
    });
    (0, node_test_1.it)('match exact 1-arg', () => {
        const text = `action manger ceci:
    dire "miam".
fin action

routine X:
    exécuter l'action manger ceci.
fin routine`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const actions = occ.filter((o) => o.kind === 'action');
        strict_1.default.equal(actions.length, 1);
        strict_1.default.equal(actions[0].name, 'manger ceci');
    });
    (0, node_test_1.it)('match exact 2-args avec prép', () => {
        const text = `action mettre ceci avec cela:
    dire "ok".
fin action

routine X:
    exécuter l'action mettre ceci avec cela.
fin routine`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const actions = occ.filter((o) => o.kind === 'action');
        strict_1.default.equal(actions.length, 1);
        strict_1.default.equal(actions[0].name, 'mettre ceci avec cela');
    });
    (0, node_test_1.it)('distingue plusieurs surcharges du même verbe', () => {
        const text = `action mettre:
    dire "0".
fin action

action mettre ceci:
    dire "1".
fin action

action mettre ceci avec cela:
    dire "2".
fin action

routine X:
    exécuter l'action mettre.
    exécuter l'action mettre ceci.
    exécuter l'action mettre ceci avec cela.
fin routine`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const actions = occ.filter((o) => o.kind === 'action');
        const sigs = actions.map((a) => a.name).sort();
        strict_1.default.deepEqual(sigs, ['mettre', 'mettre ceci', 'mettre ceci avec cela']);
    });
    (0, node_test_1.it)('fallback sur le verbe seul si la signature exacte manque', () => {
        const text = `action prendre ceci:
    dire "ok".
fin action

routine X:
    exécuter l'action prendre la pomme.
fin routine`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        const actions = occ.filter((o) => o.kind === 'action');
        strict_1.default.equal(actions.length, 1);
        strict_1.default.equal(actions[0].name, 'prendre');
    });
    (0, node_test_1.it)("ignore une référence à une action inconnue", () => {
        const text = `exécuter l'action voler.`;
        const occ = (0, declarationScanner_1.findOccurrences)(text, (0, declarationScanner_1.findDeclarations)(text));
        strict_1.default.equal(occ.length, 0);
    });
});
(0, node_test_1.describe)('intégration — extrait de bzzz.djn', () => {
    const bzzz = `Le portefeuille est un compteur initialisé à 15.
La place du village est un lieu.
Le boucher est une personne dans la boucherie.
L'apicultrice (f) est une personne dans la boutique des abeilles.

routine ContenuPortefeuille:
    dire "[c portefeuille]".
fin routine

routine PasAssez:
    dire "rien".
fin routine

règle après afficher l’inventaire:
    exécuter la routine ContenuPortefeuille.
fin règle`;
    (0, node_test_1.it)('extrait toutes les déclarations', () => {
        const decls = (0, declarationScanner_1.findDeclarations)(bzzz);
        const variables = names(byKind(decls, 'variable')).sort();
        const routines = names(byKind(decls, 'routine')).sort();
        strict_1.default.deepEqual(variables, ['apicultrice', 'boucher', 'place du village', 'portefeuille']);
        strict_1.default.deepEqual(routines, ['contenuportefeuille', 'pasassez']);
    });
    (0, node_test_1.it)('détecte la référence à la routine', () => {
        const occ = (0, declarationScanner_1.findOccurrences)(bzzz, (0, declarationScanner_1.findDeclarations)(bzzz));
        const routineRefs = occ.filter((o) => o.kind === 'routine');
        strict_1.default.equal(routineRefs.length, 1);
        strict_1.default.equal(routineRefs[0].name, 'contenuportefeuille');
    });
});
//# sourceMappingURL=declarationScanner.test.js.map