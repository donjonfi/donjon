import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditeurComponent } from './editeur/editeur.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { VueElementGeneriqueComponent } from './vue-element-generique/vue-element-generique.component';

@NgModule({
  declarations: [
    AppComponent,
    EditeurComponent,
    PageNotFoundComponent,
    VueElementGeneriqueComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
