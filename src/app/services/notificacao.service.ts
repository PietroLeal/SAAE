import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  data: Date;
  lida: boolean;
  tipo: 'reserva' | 'cancelamento' | 'lembrete' | 'sistema';
  dados?: any;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificacoes: Notificacao[] = [];
  private notificacoesSubject = new BehaviorSubject<Notificacao[]>([]);
  notificacoes$ = this.notificacoesSubject.asObservable();

  constructor(private platform: Platform) {
    this.init();
    this.carregarNotificacoes();
  }

  async init() {
    await this.platform.ready();
    this.carregarNotificacoes();
  }

  private carregarNotificacoes() {
    const saved = localStorage.getItem('notificacoes');
    if (saved) {
      this.notificacoes = JSON.parse(saved);
      this.notificacoesSubject.next(this.notificacoes);
    }
  }

  private salvarNotificacoes() {
    localStorage.setItem('notificacoes', JSON.stringify(this.notificacoes));
    this.notificacoesSubject.next(this.notificacoes);
  }

  adicionarNotificacao(notificacao: Omit<Notificacao, 'id' | 'data' | 'lida'>) {
    const novaNotificacao: Notificacao = {
      id: Date.now(),
      data: new Date(),
      lida: false,
      ...notificacao
    };
    
    this.notificacoes.unshift(novaNotificacao);
    this.salvarNotificacoes();
    return novaNotificacao;
  }

  marcarComoLida(id: number) {
    const notif = this.notificacoes.find(n => n.id === id);
    if (notif) {
      notif.lida = true;
      this.salvarNotificacoes();
    }
  }

  marcarTodasComoLidas() {
    this.notificacoes.forEach(n => n.lida = true);
    this.salvarNotificacoes();
  }

  removerNotificacao(id: number) {
    this.notificacoes = this.notificacoes.filter(n => n.id !== id);
    this.salvarNotificacoes();
  }

  limparTodas() {
    this.notificacoes = [];
    this.salvarNotificacoes();
  }

  getNaoLidasCount(): number {
    return this.notificacoes.filter(n => !n.lida).length;
  }

  getHorarioLabel(horario: number): string {
    const horarios = [
      '1º Horário (07:00 - 07:50)',
      '2º Horário (07:50 - 08:40)',
      '3º Horário (08:50 - 09:40)',
      '4º Horário (09:40 - 10:30)',
      '5º Horário (10:30 - 11:20)',
      '6º Horário (11:20 - 12:10)',
      '7º Horário (12:30 - 13:20)',
      '8º Horário (13:20 - 14:10)',
      '9º Horário (14:10 - 15:00)',
      '10º Horário (15:10 - 16:00)',
      '11º Horário (16:00 - 16:50)',
      '12º Horário (16:50 - 17:40)'
    ];
    return horarios[horario - 1] || `${horario}º Horário`;
  }

  async notificarReservaCriada(salaNome: string, data: string, horario: number) {
    const horarioLabel = this.getHorarioLabel(horario);
    const titulo = 'Reserva Confirmada';
    const mensagem = `Sala ${salaNome} reservada para ${data} no ${horarioLabel}`;
    
    this.adicionarNotificacao({
      titulo,
      mensagem,
      tipo: 'reserva',
      dados: { salaNome, data, horario }
    });
  }

  async notificarReservaCancelada(salaNome: string, data: string, horario: number) {
    const horarioLabel = this.getHorarioLabel(horario);
    const titulo = 'Reserva Cancelada';
    const mensagem = `Reserva da sala ${salaNome} para ${data} no ${horarioLabel} foi cancelada`;
    
    this.adicionarNotificacao({
      titulo,
      mensagem,
      tipo: 'cancelamento',
      dados: { salaNome, data, horario }
    });
  }

  async notificarBoasVindas(nome: string) {
    const titulo = 'Bem-vindo!';
    const mensagem = `Olá ${nome}, seu cadastro foi realizado com sucesso!`;
    
    this.adicionarNotificacao({
      titulo,
      mensagem,
      tipo: 'sistema',
      dados: { nome }
    });
  }
}