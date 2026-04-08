import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Log {
  id?: number;
  acao: string;
  usuarioId: number;
  usuarioNome: string;
  usuarioTipo: string;
  detalhes: any;
  data: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  async registrarLog(acao: string, detalhes: any) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      await this.api.create('logs', {
        acao: acao,
        usuarioId: user.id,
        usuarioNome: user.nome,
        usuarioTipo: user.tipo,
        detalhes: detalhes,
        data: new Date()
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  async getLogs(limite: number = 100): Promise<Log[]> {
    return await this.api.getWithQuery('logs', { limite, orderBy: 'data', order: 'DESC' });
  }

  async getLogsPorUsuario(usuarioId: number, limite: number = 50): Promise<Log[]> {
    return await this.api.getWithQuery('logs', { usuarioId, limite, orderBy: 'data', order: 'DESC' });
  }
}