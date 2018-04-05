import { EditeurComponent } from './editeur/editeur.component';
import { PageNotFoundComponentComponent } from './page-not-found-component/page-not-found-component.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
  { path: '**', component: PageNotFoundComponentComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
