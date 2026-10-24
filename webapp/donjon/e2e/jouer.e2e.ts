import { expect, test } from '@playwright/test';
import { appuyerSurUneTouche, executerCommande, lireCommandesSolution, lireJeu, servirFichier, sortie } from './utils';

// Le lecteur de dev charge automatiquement assets/jeux/jeu.djn (chargementAutoJeu).
test.beforeEach(async ({ page }) => {
  await servirFichier(page, '**/assets/jeux/jeu.djn', lireJeu('coince_v3.djn'));
  await page.goto('/');
  await expect(sortie(page)).toContainText('Le salon');
});

test('intro : le salon et la sortie nord obstruée', async ({ page }) => {
  await expect(sortie(page)).toContainText('Vous êtes dans un petit salon dépouillé.');
  await expect(sortie(page)).toContainText('obstrué');
});

test('solution coince_v3.sol : la partie est gagnée', async ({ page }) => {
  for (const commande of lireCommandesSolution('coince_v3.sol')) {
    await executerCommande(page, commande);
    if (commande === 'actionner bouton') {
      await expect(sortie(page)).toContainText('Une porte s’ouvre dans le mur nord');
    } else if (commande === 'n') {
      await expect(sortie(page)).toContainText('Le cabinet');
    }
  }
  await appuyerSurUneTouche(page);
  await expect(sortie(page)).toContainText('Bravo! Vous avez gagné !');
});

test('commande inconnue : le jeu répond sans planter', async ({ page }) => {
  await executerCommande(page, 'danser la gigue');
  await executerCommande(page, 'x fauteuil');
  await expect(sortie(page)).toContainText('vieux fauteuil en cuir brun');
});
