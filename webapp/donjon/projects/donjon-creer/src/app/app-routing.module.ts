import { RouterModule, Routes } from '@angular/router';

import { EditeurComponent } from './editeur/editeur.component';
import { NgModule } from '@angular/core';
import { USE_HASH_ROUTING } from '../environments/environment';

const routes: Routes = [
  {
    path: '',
    component: EditeurComponent
  },
  {
    path: ':fichier',
    component: EditeurComponent
  },
  /** page introuvable */
  { path: '**', component: EditeurComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: USE_HASH_ROUTING })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
