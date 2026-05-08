import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApercuObjetComponent } from './apercu-objet.component';

describe('ApercuObjetComponent', () => {
  let component: ApercuObjetComponent;
  let fixture: ComponentFixture<ApercuObjetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApercuObjetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApercuObjetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
