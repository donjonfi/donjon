import { RouterModule, Routes } from '@angular/router';

import { AccueilComponent } from './accueil/accueil.component';
import { EditeurComponent } from './editeur/editeur.component';
import { JouerComponent } from './jouer/jouer.component';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: 'accueil',
    component: AccueilComponent
  },
  {
    path: 'jouer/:fichier',
    component: JouerComponent
  },
  {
    path: 'editeur',
    component: EditeurComponent
  },
  {
    path: '',
    redirectTo: '/accueil',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
