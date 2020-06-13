import { ACE_CONFIG } from 'ngx-ace-wrapper';
import { AccueilComponent } from './accueil/accueil.component';
import { AceConfigInterface } from 'ngx-ace-wrapper';
import { AceModule } from 'ngx-ace-wrapper';
import { ApercuElementGeneriqueComponent } from './apercu/apercu-element-generique/apercu-element-generique.component';
import { ApercuInstructionComponent } from './apercu/apercu-instruction/apercu-instruction.component';
import { ApercuMondeComponent } from './apercu/apercu-monde/apercu-monde.component';
import { ApercuSujetComponent } from './apercu/apercu-sujet/apercu-sujet.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { EditeurComponent } from './editeur/editeur.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { JouerComponent } from './jouer/jouer.component';
import { LecteurComponent } from './lecteur/lecteur.component';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ApercuRegleComponent } from './apercu/apercu-regle/apercu-regle.component';
import { ApercuActionComponent } from './apercu/apercu-action/apercu-action.component';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
  tabSize: 2
};

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    EditeurComponent,
    LecteurComponent,
    ApercuMondeComponent,
    AccueilComponent,
    JouerComponent,
    ApercuInstructionComponent,
    ApercuSujetComponent,
    ApercuElementGeneriqueComponent,
    ApercuRegleComponent,
    ApercuActionComponent,


  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AceModule,
    HttpClientModule,
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
