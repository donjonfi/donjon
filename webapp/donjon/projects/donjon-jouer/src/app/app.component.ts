import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { version } from 'donjon';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  version = version;

  get afficherPiedPage(): boolean {
    return environment.piedDePage;
  }
}
