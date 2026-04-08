import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerenciarSalasPage } from './gerenciar-salas.page';

describe('GerenciarSalasPage', () => {
  let component: GerenciarSalasPage;
  let fixture: ComponentFixture<GerenciarSalasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerenciarSalasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
