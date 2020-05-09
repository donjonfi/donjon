import { ACE_CONFIG } from 'ngx-ace-wrapper';
import { AccueilComponent } from './accueil/accueil.component';
import { AceConfigInterface } from 'ngx-ace-wrapper';
import { AceModule } from 'ngx-ace-wrapper';
import { ApercuInstructionComponent } from './apercu/apercu-instruction/apercu-instruction.component';
import { ApercuMondeComponent } from './apercu/apercu-monde/apercu-monde.component';
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
import { VueElementGeneriqueComponent } from './vue-element-generique/vue-element-generique.component';
import { ApercuSujetComponent } from './apercu/apercu-sujet/apercu-sujet.component';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
  tabSize: 2
};

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    VueElementGeneriqueComponent,
    EditeurComponent,
    LecteurComponent,
    ApercuMondeComponent,
    AccueilComponent,
    JouerComponent,
    ApercuInstructionComponent,
    ApercuSujetComponent,


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
