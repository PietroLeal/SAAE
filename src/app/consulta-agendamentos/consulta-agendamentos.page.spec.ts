import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultaAgendamentosPage } from './consulta-agendamentos.page';

describe('ConsultaAgendamentosPage', () => {
  let component: ConsultaAgendamentosPage;
  let fixture: ComponentFixture<ConsultaAgendamentosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultaAgendamentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
