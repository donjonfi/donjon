import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditeurComponent } from './editeur/editeur.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: 'editeur',
    component: EditeurComponent
  },
  {
    path: '',
    redirectTo: '/editeur',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
