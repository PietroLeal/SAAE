import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ApiService } from './api.service';

export interface Sala {
  id?: number;
  nome: string;
  tipoAmbiente: string;
  capacidade: number;
  recursos: string[];
  descricao?: string;
  ativa: boolean;
  createdAt?: Date;
}

export const TIPOS_AMBIENTE = [
  { valor: 'sala', nome: 'Sala de Aula', icone: 'school-outline' },
  { valor: 'laboratorio', nome: 'Laboratório', icone: 'flask-outline' },
  { valor: 'auditorio', nome: 'Auditório', icone: 'mic-outline' },
  { valor: 'sala_video', nome: 'Sala de Vídeo', icone: 'videocam-outline' },
  { valor: 'sala_informatica', nome: 'Sala de Informática', icone: 'desktop-outline' },
  { valor: 'biblioteca', nome: 'Biblioteca', icone: 'book-outline' },
  { valor: 'quadra', nome: 'Quadra Esportiva', icone: 'basketball-outline' }
];

@Injectable({
  providedIn: 'root'
})
export class SalaService {
  constructor(private api: ApiService) {}

  getSalas(): Observable<Sala[]> {
    return from(this.api.getAll('salas'));
  }

  async addSala(sala: Omit<Sala, 'id'>): Promise<number> {
    const result = await this.api.create('salas', sala);
    return result.id;
  }

  async updateSala(id: number, sala: Partial<Sala>): Promise<void> {
    await this.api.update('salas', id, sala);
  }

  async deleteSala(id: number): Promise<void> {
    await this.api.delete('salas', id);
  }
}