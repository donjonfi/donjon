import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  Declaration,
  DeclarationKind,
  findDeclarations,
  findOccurrences,
} from './declarationScanner';

function byKind(decls: Declaration[], kind: DeclarationKind): Declaration[] {
  return decls.filter((d) => d.kind === kind);
}

function names(decls: Declaration[]): string[] {
  return decls.map((d) => d.name);
}

describe('findDeclarations — instances (article défini)', () => {
  it('détecte « Le X est un Y »', () => {
    const decls = byKind(
      findDeclarations('Le portefeuille est un compteur initialisé à 15.'),
      'variable'
    );
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'portefeuille');
    assert.equal(decls[0].displayName, 'portefeuille');
    assert.equal(decls[0].parent, 'compteur');
  });

  it('détecte « La X est une Y »', () => {
    const decls = byKind(findDeclarations('La saucisse est une charcuterie.'), 'variable');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'saucisse');
    assert.equal(decls[0].parent, 'charcuterie');
  });

  it('détecte « Les X sont des Y »', () => {
    const decls = byKind(findDeclarations('Les pommes sont des fruits.'), 'variable');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'pommes');
    assert.equal(decls[0].parent, 'fruits');
  });

  it("détecte l'article élidé « L'X est … »", () => {
    const decls = byKind(
      findDeclarations("L'horloge est un objet dans le salon."),
      'variable'
    );
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'horloge');
    assert.equal(decls[0].parent, 'objet');
  });

  it('détecte le suffixe de genre « (f) »', () => {
    const decls = byKind(
      findDeclarations("L'apicultrice (f) est une personne dans la boutique."),
      'variable'
    );
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'apicultrice');
    assert.equal(decls[0].parent, 'personne');
  });

  it('gère les noms multi-mots', () => {
    const decls = byKind(findDeclarations('Le pot de miel est un objet sur la table.'), 'variable');
    const found = decls.find((d) => d.name === 'pot de miel');
    assert.ok(found, 'pot de miel doit être détecté');
    assert.equal(found!.parent, 'objet');
  });

  it("expose les positions name/declaration cohérentes", () => {
    const text = 'Le boucher est une personne.';
    const decl = byKind(findDeclarations(text), 'variable')[0];
    assert.equal(text.slice(decl.nameStart, decl.nameEnd), 'boucher');
    assert.equal(text.slice(decl.declarationStart, decl.declarationEnd).trim().startsWith('Le boucher'), true);
  });
});

describe('findDeclarations — instances (nom propre, sans article)', () => {
  it('détecte « Céline (f) est une personne dans le salon. »', () => {
    const text = 'Céline (f) est une personne dans le salon.';
    const decls = byKind(findDeclarations(text), 'variable');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'céline');
    assert.equal(decls[0].displayName, 'Céline');
    assert.equal(decls[0].parent, 'personne');
    assert.equal(text.slice(decls[0].nameStart, decls[0].nameEnd), 'Céline');
  });

  it('détecte un nom propre sans suffixe de genre', () => {
    const decls = byKind(findDeclarations('Élise est une magicienne.'), 'variable');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'élise');
    assert.equal(decls[0].parent, 'magicienne');
  });

  it('gère un nom propre composé avec trait d’union', () => {
    const decls = byKind(findDeclarations('Jean-Pierre est un voisin.'), 'variable');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'jean-pierre');
    assert.equal(decls[0].displayName, 'Jean-Pierre');
    assert.equal(decls[0].parent, 'voisin');
  });

  it('gère un nom propre avec apostrophe', () => {
    const decls = byKind(findDeclarations("D'Artagnan est un mousquetaire."), 'variable');
    const found = decls.find((d) => d.name === "d'artagnan");
    assert.ok(found, "D'Artagnan doit être détecté");
    assert.equal(found!.parent, 'mousquetaire');
  });

  it('gère un nom propre composé avec espace', () => {
    const decls = byKind(findDeclarations('Marie Curie est une physicienne.'), 'variable');
    const found = decls.find((d) => d.name === 'marie curie');
    assert.ok(found, 'Marie Curie doit être détecté');
    assert.equal(found!.parent, 'physicienne');
  });

  it("ne double pas une déclaration déjà introduite par un article défini", () => {
    // « Le bouton est un objet. » commence par une majuscule (« Le »), mais
    // est déjà couvert par INSTANCE_DECLARATION : un seul match attendu.
    const decls = byKind(findDeclarations('Le bouton est un objet.'), 'variable');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'bouton');
  });

  it('ne déclenche pas sur une amorce de type indéfini', () => {
    // « Un sac est un contenant. » reste un type ; la regex nom propre est
    // bloquée par le lookahead négatif sur « Un\s ».
    const variables = byKind(findDeclarations('Un sac est un contenant.'), 'variable');
    assert.equal(variables.length, 0);
  });

  it('détecte les occurrences ultérieures d’un nom propre', () => {
    const text = `Céline (f) est une personne dans le salon.
Céline porte un chapeau.
le joueur regarde céline.`;
    const decls = findDeclarations(text);
    const occurrences = findOccurrences(text, decls);
    const celineOcc = occurrences.filter((o) => o.name === 'céline');
    // 1 dans la déclaration + 2 dans le corps = 3 occurrences au moins
    assert.ok(celineOcc.length >= 3, `attendu ≥ 3 occurrences, reçu ${celineOcc.length}`);
    assert.ok(celineOcc.every((o) => o.kind === 'variable'));
  });
});

describe('findDeclarations — types (article indéfini)', () => {
  it('détecte « Un X est un Y »', () => {
    const decls = byKind(findDeclarations('Un sac est un contenant.'), 'type');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'sac');
    assert.equal(decls[0].parent, 'contenant');
  });

  it('détecte « Une X est une Y »', () => {
    const decls = byKind(findDeclarations('Une charcuterie est une nourriture.'), 'type');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'charcuterie');
  });

  it('priorise « instance » sur « type » homonyme dans les occurrences', () => {
    const text = `Un fruit est un objet.
La pomme est un fruit.
Le boucher mange la pomme.`;
    const decls = findDeclarations(text);
    assert.ok(byKind(decls, 'type').some((d) => d.name === 'fruit'));
    assert.ok(byKind(decls, 'variable').some((d) => d.name === 'pomme'));
    const occurrences = findOccurrences(text, decls);
    const pomme = occurrences.filter((o) => o.name === 'pomme');
    assert.ok(pomme.length >= 2, 'pomme doit avoir plusieurs occurrences');
    assert.ok(pomme.every((o) => o.kind === 'variable'));
  });
});

describe('findDeclarations — routines', () => {
  it('détecte « routine X: »', () => {
    const decls = byKind(findDeclarations('routine ContenuPortefeuille:'), 'routine');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'contenuportefeuille');
    assert.equal(decls[0].displayName, 'ContenuPortefeuille');
  });

  it('ignore les noms à plusieurs mots après « routine »', () => {
    // les routines sont identifiées par un identifiant simple, pas une phrase
    const decls = byKind(findDeclarations('routine Pas Assez:'), 'routine');
    // « Pas » est un identifiant valide ; tout ce qui suit est ignoré jusqu'à `:`
    // donc on doit avoir une routine nommée « Pas » (single-word)
    assert.equal(decls.length, 0, 'pas de match si le nom contient un espace avant `:`');
  });
});

describe('findDeclarations — actions', () => {
  it('détecte « action verbe: » (0 arg)', () => {
    const decls = byKind(findDeclarations('action manger:'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'manger');
  });

  it('détecte « action verbe ceci: » (1 arg)', () => {
    const decls = byKind(findDeclarations('action manger ceci:'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'manger ceci');
  });

  it('détecte « action verbe ceci avec cela: » (2 args avec prép)', () => {
    const decls = byKind(findDeclarations('action mettre ceci avec cela:'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'mettre ceci avec cela');
  });

  it('détecte « règle remplacer verbe: » comme une déclaration d’action (signature seule)', () => {
    const decls = byKind(findDeclarations('règle remplacer sauter:'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'sauter');
  });

  it('détecte « regle remplacer verbe ceci: » (variante sans accent)', () => {
    const decls = byKind(findDeclarations('regle remplacer sauter sur ceci:'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'sauter sur ceci');
  });

  it('détecte « règle remplacer verbe avec cela: » (2 args + prép)', () => {
    const decls = byKind(findDeclarations('règle remplacer mettre ceci avec cela:'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'mettre ceci avec cela');
  });

  it('ne confond pas « règle avant verbe: » avec une déclaration d’action', () => {
    const decls = byKind(findDeclarations('règle avant sauter:'), 'action');
    assert.equal(decls.length, 0);
  });

  it('détecte « action verbe ceci concernant cela: »', () => {
    const decls = byKind(
      findDeclarations('action interroger ceci concernant cela:'),
      'action'
    );
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'interroger ceci concernant cela');
  });

  it('normalise les espaces multiples', () => {
    const decls = byKind(findDeclarations('action  mettre   ceci   avec   cela  :'), 'action');
    assert.equal(decls.length, 1);
    assert.equal(decls[0].name, 'mettre ceci avec cela');
  });
});

describe('findDeclarations — masquage des commentaires et chaînes', () => {
  it('ignore les déclarations dans un commentaire', () => {
    const decls = findDeclarations('-- Le boucher est une personne.');
    assert.equal(decls.length, 0);
  });

  it('ignore les déclarations dans une chaîne', () => {
    const decls = findDeclarations('dire "Le boucher est une personne.".');
    assert.equal(decls.length, 0);
  });

  it("ignore les chaînes multi-lignes", () => {
    const text = `dire "première ligne
Le boucher est une personne.
deuxième ligne".`;
    assert.equal(findDeclarations(text).length, 0);
  });
});

describe('findOccurrences — instances et types', () => {
  it('reconnaît une instance après son article (peu importe le déterminant)', () => {
    const text = `Le boucher est une personne.
Le joueur parle au boucher.
La conversation avec le boucher est animée.`;
    const occ = findOccurrences(text, findDeclarations(text));
    const bouchers = occ.filter((o) => o.name === 'boucher');
    assert.equal(bouchers.length, 3);
    assert.ok(bouchers.every((b) => b.kind === 'variable'));
  });

  it('ne reconnaît pas un mot dans un commentaire', () => {
    const text = `Le boucher est une personne.
-- bla bla boucher`;
    const occ = findOccurrences(text, findDeclarations(text));
    assert.equal(occ.filter((o) => o.name === 'boucher').length, 1);
  });

  it('ne reconnaît pas un mot dans une chaîne', () => {
    const text = `Le boucher est une personne.
dire "Le boucher est gentil".`;
    const occ = findOccurrences(text, findDeclarations(text));
    assert.equal(occ.filter((o) => o.name === 'boucher').length, 1);
  });

  it('respecte les frontières de mots Unicode', () => {
    const text = `Le sac est un contenant.
Le sacrement est en jeu.`;
    const occ = findOccurrences(text, findDeclarations(text));
    // « sac » ne doit PAS matcher dans « sacrement »
    const sacs = occ.filter((o) => o.name === 'sac');
    assert.equal(sacs.length, 1);
  });
});

describe('findOccurrences — routines', () => {
  it('reconnaît « exécuter la routine X »', () => {
    const text = `routine ContenuPortefeuille:
    dire "ok".
fin routine

règle après afficher l’inventaire:
    exécuter la routine ContenuPortefeuille.
fin règle`;
    const occ = findOccurrences(text, findDeclarations(text));
    const refs = occ.filter((o) => o.kind === 'routine' && o.name === 'contenuportefeuille');
    assert.equal(refs.length, 1);
  });

  it('reconnaît « exécuter routine X » (sans « la »)', () => {
    const text = `routine PasAssez:
    dire "non".
fin routine

action commencer:
    exécuter routine PasAssez.
fin action`;
    const occ = findOccurrences(text, findDeclarations(text));
    assert.equal(occ.filter((o) => o.kind === 'routine').length, 1);
  });

  it("ignore une référence à une routine inconnue", () => {
    const text = `exécuter la routine Inexistante.`;
    const occ = findOccurrences(text, findDeclarations(text));
    assert.equal(occ.length, 0);
  });
});

describe('findOccurrences — actions', () => {
  it('match exact 0-arg', () => {
    const text = `action regarder:
    dire "regard".
fin action

routine X:
    exécuter l'action regarder.
fin routine`;
    const occ = findOccurrences(text, findDeclarations(text));
    const actions = occ.filter((o) => o.kind === 'action');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].name, 'regarder');
  });

  it('match exact 1-arg', () => {
    const text = `action manger ceci:
    dire "miam".
fin action

routine X:
    exécuter l'action manger ceci.
fin routine`;
    const occ = findOccurrences(text, findDeclarations(text));
    const actions = occ.filter((o) => o.kind === 'action');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].name, 'manger ceci');
  });

  it('match exact 2-args avec prép', () => {
    const text = `action mettre ceci avec cela:
    dire "ok".
fin action

routine X:
    exécuter l'action mettre ceci avec cela.
fin routine`;
    const occ = findOccurrences(text, findDeclarations(text));
    const actions = occ.filter((o) => o.kind === 'action');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].name, 'mettre ceci avec cela');
  });

  it('distingue plusieurs surcharges du même verbe', () => {
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
    const occ = findOccurrences(text, findDeclarations(text));
    const actions = occ.filter((o) => o.kind === 'action');
    const sigs = actions.map((a) => a.name).sort();
    assert.deepEqual(sigs, ['mettre', 'mettre ceci', 'mettre ceci avec cela']);
  });

  it('fallback sur le verbe seul si la signature exacte manque', () => {
    const text = `action prendre ceci:
    dire "ok".
fin action

routine X:
    exécuter l'action prendre la pomme.
fin routine`;
    const occ = findOccurrences(text, findDeclarations(text));
    const actions = occ.filter((o) => o.kind === 'action');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].name, 'prendre');
  });

  it("ignore une référence à une action inconnue", () => {
    const text = `exécuter l'action voler.`;
    const occ = findOccurrences(text, findDeclarations(text));
    assert.equal(occ.length, 0);
  });
});

describe('intégration — extrait de bzzz.djn', () => {
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

  it('extrait toutes les déclarations', () => {
    const decls = findDeclarations(bzzz);
    const variables = names(byKind(decls, 'variable')).sort();
    const routines = names(byKind(decls, 'routine')).sort();
    assert.deepEqual(variables, ['apicultrice', 'boucher', 'place du village', 'portefeuille']);
    assert.deepEqual(routines, ['contenuportefeuille', 'pasassez']);
  });

  it('détecte la référence à la routine', () => {
    const occ = findOccurrences(bzzz, findDeclarations(bzzz));
    const routineRefs = occ.filter((o) => o.kind === 'routine');
    assert.equal(routineRefs.length, 1);
    assert.equal(routineRefs[0].name, 'contenuportefeuille');
  });
});
