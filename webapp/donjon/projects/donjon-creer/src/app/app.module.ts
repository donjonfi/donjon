import { ACE_CONFIG, AceConfigInterface, AceModule } from 'ngx-ace-wrapper';
import { LocationStrategy } from '@angular/common';
import { NoopLocationStrategy } from './noop-location-strategy';
import { STANDALONE_MODE } from '../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ApercuModule, DonjonModule, VisualisationModule } from 'donjon';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { CommonModule } from '@angular/common';
import { EditeurComponent } from './editeur/editeur.component';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
  tabSize: 2
};

@NgModule({
  declarations: [
    AppComponent,
    EditeurComponent
  ],
  bootstrap: [AppComponent],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    CollapseModule,
    TooltipModule,
    AceModule,
    DonjonModule,
    ApercuModule,
    VisualisationModule
  ],
  providers: [
    {
      provide: ACE_CONFIG,
      useValue: DEFAULT_ACE_CONFIG
    },
    ...(STANDALONE_MODE ? [{ provide: LocationStrategy, useClass: NoopLocationStrategy }] : []),
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule { }
