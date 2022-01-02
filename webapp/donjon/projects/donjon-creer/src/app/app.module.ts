import { ACE_CONFIG, AceConfigInterface, AceModule } from 'ngx-ace-wrapper';
import { DonjonModule, LecteurComponent } from '@donjon/core';

import { ApercuActionComponent } from './apercu/apercu-action/apercu-action.component';
import { ApercuConditionComponent } from './apercu/apercu-condition/apercu-condition.component';
import { ApercuElementGeneriqueComponent } from './apercu/apercu-element-generique/apercu-element-generique.component';
import { ApercuInstructionComponent } from './apercu/apercu-instruction/apercu-instruction.component';
import { ApercuMondeComponent } from './apercu/apercu-monde/apercu-monde.component';
import { ApercuProprieteJeuComponent } from './apercu/apercu-propriete-jeu/apercu-propriete-jeu.component';
import { ApercuReactionComponent } from './apercu/apercu-reaction/apercu-reaction.component';
import { ApercuRegleComponent } from './apercu/apercu-regle/apercu-regle.component';
import { ApercuSujetComponent } from './apercu/apercu-sujet/apercu-sujet.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { CommonModule } from '@angular/common';
import { EditeurComponent } from './editeur/editeur.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { VisuLieuComponent } from './visualisation/visu-lieu/visu-lieu.component';
import { VisualisationComponent } from './visualisation/visualisation/visualisation.component';
import { VisuObjetComponent } from './visualisation/visu-objet/visu-objet.component';
import { VisuDetailObjetComponent } from './visualisation/visu-detail-objet/visu-detail-objet.component';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
  tabSize: 2
};

@NgModule({
  declarations: [
    AppComponent,
    ApercuActionComponent,
    ApercuConditionComponent,
    ApercuElementGeneriqueComponent,
    ApercuInstructionComponent,
    ApercuMondeComponent,
    ApercuReactionComponent,
    ApercuRegleComponent,
    ApercuSujetComponent,
    EditeurComponent,
    ApercuProprieteJeuComponent,
    VisuLieuComponent,
    VisualisationComponent,
    VisuObjetComponent,
    VisuDetailObjetComponent
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    CollapseModule.forRoot(),
    TooltipModule.forRoot(),
    AceModule,
    DonjonModule
  ],
  providers: [
    {
      provide: ACE_CONFIG,
      useValue: DEFAULT_ACE_CONFIG
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
