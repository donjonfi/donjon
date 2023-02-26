import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClavierTactileComponent } from './clavier-tactile.component';

describe('ClavierTactileComponent', () => {
  let component: ClavierTactileComponent;
  let fixture: ComponentFixture<ClavierTactileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClavierTactileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClavierTactileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
