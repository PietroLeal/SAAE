import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Permissoes {
  verDashboard: boolean;
  agendarSala: boolean;
  cancelarAgendamento: boolean;
  verSalas: boolean;
  gerenciarSalas: boolean;
  gerenciarDisponibilidade: boolean;
  verUsuarios: boolean;
  gerenciarUsuarios: boolean;
  verRelatorios: boolean;
  gerarRelatorios: boolean;
  verLogs: boolean;
  gerenciarRecursos: boolean;
  gerenciarPerfis: boolean;
  manutencaoSistema: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissaoService {
  private permissoesCache: Map<string, Permissoes> = new Map();

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  async getPermissoesDoUsuario(forcarRefresh: boolean = false): Promise<Permissoes | null> {
    const user = this.authService.getCurrentUser();
    if (!user) return null;

    const userTipo = user.tipo;
    if (!userTipo) return null;

    if (!forcarRefresh && this.permissoesCache.has(userTipo)) {
      console.log('📦 Usando cache para', userTipo);
      return this.permissoesCache.get(userTipo)!;
    }

    try {
      const permissoes = await this.api.getById('permissoes', userTipo);
      
      if (permissoes) {
        this.permissoesCache.set(userTipo, permissoes as Permissoes);
        console.log('✅ Permissões carregadas do MariaDB para', userTipo);
        return permissoes as Permissoes;
      }

      console.log('⚠️ Permissões não encontradas para', userTipo, ', criando padrão');
      const permissoesPadrao = this.getPermissoesPadrao(userTipo);
      await this.api.create('permissoes', { perfil: userTipo, ...permissoesPadrao });
      this.permissoesCache.set(userTipo, permissoesPadrao);
      return permissoesPadrao;

    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      return null;
    }
  }

  async refreshPermissoes(): Promise<Permissoes | null> {
    console.log('🔄 Forçando refresh das permissões');
    this.permissoesCache.clear();
    return this.getPermissoesDoUsuario(true);
  }

  getPermissoesPadrao(tipo: string): Permissoes {
    const padrao: Record<string, Permissoes> = {
      'Professor': {
        verDashboard: true,
        agendarSala: true,
        cancelarAgendamento: true,
        verSalas: true,
        gerenciarSalas: false,
        gerenciarDisponibilidade: false,
        verUsuarios: false,
        gerenciarUsuarios: false,
        verRelatorios: false,
        gerarRelatorios: false,
        verLogs: false,
        gerenciarRecursos: false,
        gerenciarPerfis: false,
        manutencaoSistema: false
      },
      'Funcionário Administrativo': {
        verDashboard: true,
        agendarSala: true,
        cancelarAgendamento: true,
        verSalas: true,
        gerenciarSalas: true,
        gerenciarDisponibilidade: true,
        verUsuarios: true,
        gerenciarUsuarios: false,
        verRelatorios: true,
        gerarRelatorios: false,
        verLogs: false,
        gerenciarRecursos: true,
        gerenciarPerfis: false,
        manutencaoSistema: false
      },
      'Coordenador': {
        verDashboard: true,
        agendarSala: true,
        cancelarAgendamento: true,
        verSalas: true,
        gerenciarSalas: true,
        gerenciarDisponibilidade: true,
        verUsuarios: true,
        gerenciarUsuarios: true,
        verRelatorios: true,
        gerarRelatorios: true,
        verLogs: false,
        gerenciarRecursos: true,
        gerenciarPerfis: false,
        manutencaoSistema: false
      },
      'Diretor': {
        verDashboard: true,
        agendarSala: true,
        cancelarAgendamento: true,
        verSalas: true,
        gerenciarSalas: true,
        gerenciarDisponibilidade: true,
        verUsuarios: true,
        gerenciarUsuarios: true,
        verRelatorios: true,
        gerarRelatorios: true,
        verLogs: true,
        gerenciarRecursos: true,
        gerenciarPerfis: true,
        manutencaoSistema: false
      },
      'Chefe de TI': {
        verDashboard: true,
        agendarSala: true,
        cancelarAgendamento: true,
        verSalas: true,
        gerenciarSalas: true,
        gerenciarDisponibilidade: true,
        verUsuarios: true,
        gerenciarUsuarios: true,
        verRelatorios: true,
        gerarRelatorios: true,
        verLogs: true,
        gerenciarRecursos: true,
        gerenciarPerfis: true,
        manutencaoSistema: true
      }
    };
    
    return padrao[tipo] || padrao['Professor'];
  }
}