import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Disponibilidade {
  id?: number;
  salaId: number;
  nomeSala: string;
  diaSemana: number;
  diaNome: string;
  horarios: number[];
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DIAS_SEMANA = [
  { valor: 1, nome: 'Segunda-feira' },
  { valor: 2, nome: 'Terça-feira' },
  { valor: 3, nome: 'Quarta-feira' },
  { valor: 4, nome: 'Quinta-feira' },
  { valor: 5, nome: 'Sexta-feira' }
];

export const HORARIOS = [
  { numero: 1, inicio: '07:00', fim: '07:50', label: '1º Horário (07:00 - 07:50)' },
  { numero: 2, inicio: '07:50', fim: '08:40', label: '2º Horário (07:50 - 08:40)' },
  { numero: 3, inicio: '08:50', fim: '09:40', label: '3º Horário (08:50 - 09:40)' },
  { numero: 4, inicio: '09:40', fim: '10:30', label: '4º Horário (09:40 - 10:30)' },
  { numero: 5, inicio: '10:30', fim: '11:20', label: '5º Horário (10:30 - 11:20)' },
  { numero: 6, inicio: '11:20', fim: '12:10', label: '6º Horário (11:20 - 12:10)' },
  { numero: 7, inicio: '12:30', fim: '13:20', label: '7º Horário (12:30 - 13:20)' },
  { numero: 8, inicio: '13:20', fim: '14:10', label: '8º Horário (13:20 - 14:10)' },
  { numero: 9, inicio: '14:10', fim: '15:00', label: '9º Horário (14:10 - 15:00)' },
  { numero: 10, inicio: '15:10', fim: '16:00', label: '10º Horário (15:10 - 16:00)' },
  { numero: 11, inicio: '16:00', fim: '16:50', label: '11º Horário (16:00 - 16:50)' },
  { numero: 12, inicio: '16:50', fim: '17:40', label: '12º Horário (16:50 - 17:40)' }
];

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadeService {
  private disponibilidadesCache = new BehaviorSubject<Disponibilidade[]>([]);

  constructor(private api: ApiService) {
    this.carregarTodasDisponibilidades();
  }

  private carregarTodasDisponibilidades() {
    this.api.getAll('disponibilidades').then(data => {
      this.disponibilidadesCache.next(data as Disponibilidade[]);
    }).catch(err => console.error('Erro ao carregar disponibilidades:', err));
  }

  getTodasDisponibilidades(): Observable<Disponibilidade[]> {
    return this.disponibilidadesCache.asObservable();
  }

  getDisponibilidadesPorSala(salaId: number): Observable<Disponibilidade[]> {
    return this.disponibilidadesCache.asObservable().pipe(
      map(disponibilidades => disponibilidades.filter(d => d.salaId === salaId))
    );
  }

  async addDisponibilidade(disponibilidade: Omit<Disponibilidade, 'id'>): Promise<number> {
    const result = await this.api.create('disponibilidades', disponibilidade);
    this.carregarTodasDisponibilidades();
    return result.id;
  }

  async addDisponibilidadeParaTodosOsDias(disponibilidade: Omit<Disponibilidade, 'id' | 'diaSemana' | 'diaNome'>): Promise<void> {
    await this.api.createDisponibilidadeTodosDias({
      salaId: disponibilidade.salaId,
      nomeSala: disponibilidade.nomeSala,
      horarios: disponibilidade.horarios,
      ativo: disponibilidade.ativo
    });
    this.carregarTodasDisponibilidades();
  }

  async updateDisponibilidade(id: number, disponibilidade: Partial<Disponibilidade>): Promise<void> {
    await this.api.update('disponibilidades', id, disponibilidade);
    this.carregarTodasDisponibilidades();
  }

  async deleteDisponibilidade(id: number): Promise<void> {
    await this.api.delete('disponibilidades', id);
    this.carregarTodasDisponibilidades();
  }
}