import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerenciarDisponibilidadePage } from './gerenciar-disponibilidade.page';

describe('GerenciarDisponibilidadePage', () => {
  let component: GerenciarDisponibilidadePage;
  let fixture: ComponentFixture<GerenciarDisponibilidadePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerenciarDisponibilidadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
