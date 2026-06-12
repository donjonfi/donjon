import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LecteurComponent } from './lecteur/lecteur.component';
import { MenuTactileComponent } from './lecteur/tactile/menu-tactile.component';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [LecteurComponent, MenuTactileComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [LecteurComponent],
})
export class DonjonModule { }
