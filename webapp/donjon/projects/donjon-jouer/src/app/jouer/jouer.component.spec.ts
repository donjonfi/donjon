import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JouerComponent } from './jouer.component';

describe('JouerComponent', () => {
  let component: JouerComponent;
  let fixture: ComponentFixture<JouerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JouerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JouerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
