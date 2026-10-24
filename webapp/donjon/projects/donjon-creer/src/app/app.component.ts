import { Component, ChangeDetectionStrategy } from '@angular/core';
import { version } from 'donjon';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
  version = version;
}
