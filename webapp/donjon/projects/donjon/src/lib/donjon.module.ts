import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LecteurComponent } from './lecteur/lecteur.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [LecteurComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [LecteurComponent],
})
export class DonjonModule { }
