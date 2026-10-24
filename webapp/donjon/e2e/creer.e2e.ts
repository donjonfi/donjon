import { expect, test } from '@playwright/test';
import { appuyerSurUneTouche, executerCommande, lireCommandesSolution, lireJeu, servirFichier, sortie } from './utils';

// L'éditeur charge assets/modeles/<fichier>.djn quand l'URL est /<fichier>.
test.beforeEach(async ({ page }) => {
  await servirFichier(page, '**/assets/modeles/coince_v3.djn', lireJeu('coince_v3.djn'));
  await page.goto('/coince_v3');
  await expect(page.locator('.ace_content')).toContainText('Le salon');
});

test('analyser puis jouer la solution coince_v3.sol', async ({ page }) => {
  await page.locator('button[tooltip="Analyser"]').click();
  await expect(sortie(page)).toContainText('Vous êtes dans un petit salon dépouillé.');

  for (const commande of lireCommandesSolution('coince_v3.sol')) {
    await executerCommande(page, commande);
  }
  await appuyerSurUneTouche(page);
  await expect(sortie(page)).toContainText('Bravo! Vous avez gagné !');
});

test('un scénario incompris est signalé à l\'analyse', async ({ page }) => {
  await servirFichier(page, '**/assets/modeles/casse.djn', 'Le salon est un lieu.\nblabla incompréhensible.\n');
  await page.goto('/casse');
  await expect(page.locator('.ace_content')).toContainText('blabla');
  await page.locator('button[tooltip="Analyser"]').click();
  await expect(page.getByText('Il y a quelque chose qui n\'a pas fonctionné')).toBeVisible();
});
