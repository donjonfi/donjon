import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisuLieuComponent } from './visu-lieu.component';

describe('VisuLieuComponent', () => {
  let component: VisuLieuComponent;
  let fixture: ComponentFixture<VisuLieuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisuLieuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisuLieuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
