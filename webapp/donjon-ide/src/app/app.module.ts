import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditeurComponent } from './editeur/editeur.component';
import { PageNotFoundComponentComponent } from './page-not-found-component/page-not-found-component.component';
import { environment } from '../environments/environment';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';



@NgModule({
  declarations: [
    AppComponent,
    EditeurComponent,
    PageNotFoundComponentComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
