import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisuDetailObjetComponent } from './visu-detail-objet.component';

describe('VisuDetailObjetComponent', () => {
  let component: VisuDetailObjetComponent;
  let fixture: ComponentFixture<VisuDetailObjetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisuDetailObjetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisuDetailObjetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
