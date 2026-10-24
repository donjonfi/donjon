import { expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Jeux de référence versionnés (cwd = webapp/donjon). */
const DOSSIER_JEUX = join(process.cwd(), '..', '..', 'ressources', 'scenarios', 'jeux');

export function lireJeu(nomFichier: string): string {
  return readFileSync(join(DOSSIER_JEUX, nomFichier), 'utf-8');
}

/** Commandes (`c:`) d'une solution `.sol`, dans l'ordre. */
export function lireCommandesSolution(nomFichier: string): string[] {
  const sol = JSON.parse(lireJeu(nomFichier));
  return (sol.etapesSauvegarde as string[])
    .filter(etape => etape.startsWith('c:'))
    .map(etape => etape.slice(2));
}

/** Sert `contenu` à la place du fichier demandé (le serveur de dev ne le connaît pas). */
export async function servirFichier(page: Page, motifUrl: string, contenu: string): Promise<void> {
  await page.route(motifUrl, route => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: contenu }));
}

/** Zone de sortie du lecteur. */
export const sortie = (page: Page) => page.locator('#taResultat');

/** Taper une commande dans le lecteur et attendre que la sortie change. */
export async function executerCommande(page: Page, commande: string): Promise<void> {
  const avant = await sortie(page).innerHTML();
  const champ = page.locator('#txtCommande');
  await champ.fill(commande);
  await champ.press('Enter');
  await expect.poll(() => sortie(page).innerHTML(), { message: `sortie après « ${commande} »` }).not.toBe(avant);
}

/** Répondre à « Veuillez appuyer sur une touche… » et attendre la suite de la sortie. */
export async function appuyerSurUneTouche(page: Page): Promise<void> {
  await expect(sortie(page)).toContainText('Veuillez appuyer sur une touche');
  const avant = await sortie(page).innerHTML();
  await page.locator('#txtCommande').press('Space');
  await expect.poll(() => sortie(page).innerHTML(), { message: 'sortie après appui sur une touche' }).not.toBe(avant);
}
