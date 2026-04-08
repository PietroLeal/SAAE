import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualizacaoDetalhadaPage } from './visualizacao-detalhada.page';

describe('VisualizacaoDetalhadaPage', () => {
  let component: VisualizacaoDetalhadaPage;
  let fixture: ComponentFixture<VisualizacaoDetalhadaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizacaoDetalhadaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
