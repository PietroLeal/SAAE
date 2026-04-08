import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastrofuncionarioPage } from './cadastrofuncionario.page';

describe('CadastrofuncionarioPage', () => {
  let component: CadastrofuncionarioPage;
  let fixture: ComponentFixture<CadastrofuncionarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CadastrofuncionarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
