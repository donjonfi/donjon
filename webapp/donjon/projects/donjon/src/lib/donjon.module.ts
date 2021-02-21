import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LecteurComponent } from './lecteur/lecteur.component';
import { NgModule } from '@angular/core';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [LecteurComponent],
  imports: [
    FormsModule
  ],
  exports: [LecteurComponent],
})
export class DonjonModule { }
