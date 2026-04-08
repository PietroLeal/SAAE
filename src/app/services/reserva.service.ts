import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Reserva {
  id?: number;
  salaId: number;
  salaNome: string;
  usuarioId: number;
  usuarioNome: string;
  data: string;
  horario: number;
  status: 'pendente' | 'confirmada' | 'cancelada';
  motivo?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  getReservasDoUsuario(): Observable<Reserva[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return new Observable();
    
    return from(this.api.getWithQuery('reservas', { usuarioId: user.id, orderBy: 'data', order: 'DESC' })).pipe(
      map((reservas: any) => reservas as Reserva[])
    );
  }

  async contarReservasSemanais(usuarioId: number, dataReferencia: Date): Promise<number> {
    const inicioSemana = new Date(dataReferencia);
    const dia = inicioSemana.getDay();
    const diff = (dia === 0 ? 6 : dia - 1);
    inicioSemana.setDate(inicioSemana.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 4);
    fimSemana.setHours(23, 59, 59, 999);
    
    const inicioStr = inicioSemana.toISOString().split('T')[0];
    const fimStr = fimSemana.toISOString().split('T')[0];
    
    const reservas = await this.api.getWithQuery('reservas', {
      usuarioId,
      data_gte: inicioStr,
      data_lte: fimStr,
      status_in: 'pendente,confirmada'
    });
    
    return reservas.length;
  }

  async getReservasDoUsuarioPorData(usuarioId: number, data: string): Promise<Reserva[]> {
    return await this.api.getWithQuery('reservas', {
      usuarioId,
      data,
      status_in: 'pendente,confirmada'
    });
  }

  async getReservasPorSalaEData(salaId: number, data: string): Promise<Reserva[]> {
    return await this.api.getWithQuery('reservas', {
      salaId,
      data,
      status_in: 'pendente,confirmada'
    });
  }

  async addReserva(reserva: Omit<Reserva, 'id'>): Promise<number> {
    const result = await this.api.create('reservas', reserva);
    return result.id;
  }

  async cancelarReserva(id: number): Promise<void> {
    await this.api.update('reservas', id, { status: 'cancelada' });
  }
}