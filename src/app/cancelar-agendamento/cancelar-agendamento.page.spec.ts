import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CancelarAgendamentoPage } from './cancelar-agendamento.page';

describe('CancelarAgendamentoPage', () => {
  let component: CancelarAgendamentoPage;
  let fixture: ComponentFixture<CancelarAgendamentoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelarAgendamentoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
