import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CollapseModule } from 'ngx-bootstrap/collapse';

import { ApercuActionComponent } from './apercu-action/apercu-action.component';
import { ApercuConditionComponent } from './apercu-condition/apercu-condition.component';
import { ApercuElementGeneriqueComponent } from './apercu-element-generique/apercu-element-generique.component';
import { ApercuInstructionComponent } from './apercu-instruction/apercu-instruction.component';
import { ApercuLieuComponent } from './apercu-lieu/apercu-lieu.component';
import { ApercuMondeComponent } from './apercu-monde/apercu-monde.component';
import { ApercuObjetComponent } from './apercu-objet/apercu-objet.component';
import { ApercuProprieteJeuComponent } from './apercu-propriete-jeu/apercu-propriete-jeu.component';
import { ApercuReactionComponent } from './apercu-reaction/apercu-reaction.component';
import { ApercuRegleComponent } from './apercu-regle/apercu-regle.component';
import { ApercuSujetComponent } from './apercu-sujet/apercu-sujet.component';

const COMPONENTS = [
  ApercuActionComponent,
  ApercuConditionComponent,
  ApercuElementGeneriqueComponent,
  ApercuInstructionComponent,
  ApercuLieuComponent,
  ApercuMondeComponent,
  ApercuObjetComponent,
  ApercuProprieteJeuComponent,
  ApercuReactionComponent,
  ApercuRegleComponent,
  ApercuSujetComponent,
];

@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule, CollapseModule],
  exports: COMPONENTS,
})
export class ApercuModule { }
