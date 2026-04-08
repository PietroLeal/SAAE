import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfisPage } from './perfis.page';

describe('PerfisPage', () => {
  let component: PerfisPage;
  let fixture: ComponentFixture<PerfisPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfisPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
