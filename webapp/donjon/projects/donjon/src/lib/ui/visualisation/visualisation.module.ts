import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { VisuDetailObjetComponent } from './visu-detail-objet/visu-detail-objet.component';
import { VisuLieuComponent } from './visu-lieu/visu-lieu.component';
import { VisuObjetComponent } from './visu-objet/visu-objet.component';
import { VisualisationComponent } from './visualisation/visualisation.component';

const COMPONENTS = [
  VisualisationComponent,
  VisuLieuComponent,
  VisuObjetComponent,
  VisuDetailObjetComponent,
];

@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule, FormsModule],
  exports: COMPONENTS,
})
export class VisualisationModule { }
