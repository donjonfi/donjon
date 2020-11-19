import { RouterModule, Routes } from '@angular/router';

import { JouerComponent } from './jouer/jouer.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: JouerComponent
  },
  {
    path: ':fichier',
    component: JouerComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
