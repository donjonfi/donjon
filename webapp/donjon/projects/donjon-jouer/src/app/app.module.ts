import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { DonjonModule } from 'donjon';
import { FormsModule } from '@angular/forms';
import { JouerComponent } from './jouer/jouer.component';
import { NgModule } from '@angular/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [
    AppComponent,
    JouerComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    TooltipModule.forRoot(),
    DonjonModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class AppModule { }
