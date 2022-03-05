import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApercuLieuComponent } from './apercu-lieu.component';

describe('ApercuLieuComponent', () => {
  let component: ApercuLieuComponent;
  let fixture: ComponentFixture<ApercuLieuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApercuLieuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApercuLieuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
