import { FormsModule } from '@angular/forms';
import { LecteurComponent } from './lecteur/lecteur.component';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [LecteurComponent],
  imports: [
    FormsModule
  ],
  exports: [LecteurComponent]
})
export class DonjonModule { }
