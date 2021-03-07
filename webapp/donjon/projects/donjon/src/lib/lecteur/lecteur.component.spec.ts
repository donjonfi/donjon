import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecteurComponent } from './lecteur.component';

describe('LecteurComponent', () => {
  let component: LecteurComponent;
  let fixture: ComponentFixture<LecteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LecteurComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LecteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


});
