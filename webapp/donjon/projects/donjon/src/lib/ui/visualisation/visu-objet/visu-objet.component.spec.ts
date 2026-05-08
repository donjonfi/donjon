import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisuObjetComponent } from './visu-objet.component';

describe('VisuObjetComponent', () => {
  let component: VisuObjetComponent;
  let fixture: ComponentFixture<VisuObjetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisuObjetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisuObjetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
