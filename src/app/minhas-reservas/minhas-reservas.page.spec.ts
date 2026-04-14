import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MinhasReservasPage } from './minhas-reservas.page';

describe('MinhasReservasPage', () => {
  let component: MinhasReservasPage;
  let fixture: ComponentFixture<MinhasReservasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MinhasReservasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
