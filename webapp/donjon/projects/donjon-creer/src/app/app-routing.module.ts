import { RouterModule, Routes } from '@angular/router';

import { EditeurComponent } from './editeur/editeur.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: EditeurComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
