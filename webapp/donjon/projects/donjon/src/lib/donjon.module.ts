import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

import { ClavierTactileComponent } from './clavier-tactile/clavier-tactile.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LecteurComponent } from './lecteur/lecteur.component';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [LecteurComponent, ClavierTactileComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [LecteurComponent],
})
export class DonjonModule { }
