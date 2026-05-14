import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { CarteScenarioComponent } from './carte-scenario.component';
import { VisualisationModule } from '../visualisation/visualisation.module';

@NgModule({
  declarations: [CarteScenarioComponent],
  imports: [CommonModule, FormsModule, VisualisationModule],
  exports: [CarteScenarioComponent],
})
export class CarteScenarioModule { }
