import { LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ApercuModule, CarteScenarioModule, DonjonModule, VisualisationModule } from 'donjon';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoopLocationStrategy } from './noop-location-strategy';
import { STANDALONE_MODE } from '../environments/environment';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [
    AppComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    CollapseModule,
    TooltipModule,
    DonjonModule,
    ApercuModule,
    VisualisationModule,
    CarteScenarioModule,
  ],
  providers: [
    ...(STANDALONE_MODE ? [{ provide: LocationStrategy, useClass: NoopLocationStrategy }] : []),
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule { }
