import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExprReg } from '../utils/compilation/expr-reg';
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

  it('xGroupeNominal: La(1) pomme de terre(2) pourrie(3)', () => {
   const result = ExprReg.xGroupeNominal.exec("La pomme de terre pourrie");
   expect(result).not.toEqual(null);
   expect(result[1]).toEqual("La ");
   expect(result[2]).toEqual("pomme de terre");
   expect(result[3]).toEqual("pourrie");
  })

  it('xGroupeNominal: la(1) canne à pèche(2)', () => {
    const result = ExprReg.xGroupeNominal.exec("la canne à pèche");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("la ");
    expect(result[2]).toEqual("canne à pèche");
    expect(result[3]).toBeUndefined();
   })
  
   it('xGroupeNominal: le(1) chapeau(2) gris(3)', () => {
    const result = ExprReg.xGroupeNominal.exec("le chapeau gris");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("le ");
    expect(result[2]).toEqual("chapeau");
    expect(result[3]).toEqual("gris");
   })
 

   it('xGroupeNominal: chapeau(2)', () => {
    const result = ExprReg.xGroupeNominal.exec("chapeau");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined();
    expect(result[2]).toEqual("chapeau");
    expect(result[3]).toBeUndefined();
   })

   it('xGroupeNominal: le(1) chapeau(2)', () => {
    const result = ExprReg.xGroupeNominal.exec("le chapeau");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("le ");
    expect(result[2]).toEqual("chapeau");
    expect(result[3]).toBeUndefined();
   })

});
