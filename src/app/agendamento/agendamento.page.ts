import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { SalaService, Sala } from '../services/sala.service';
import { ReservaService } from '../services/reserva.service';
import { DisponibilidadeService, HORARIOS } from '../services/disponibilidade.service';
import { LogService } from '../services/log.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  timeOutline,
  businessOutline,
  checkmarkCircleOutline,
  documentTextOutline
} from 'ionicons/icons';

export const GRUPOS_HORARIOS = [
  { nome: '1º Bloco', horarios: [1, 2], label: '1º e 2º Horários (07:00 - 08:40)' },
  { nome: '2º Bloco', horarios: [3, 4], label: '3º e 4º Horários (08:50 - 10:30)' },
  { nome: '3º Bloco', horarios: [5, 6], label: '5º e 6º Horários (10:30 - 12:10)' },
  { nome: '4º Bloco', horarios: [7, 8], label: '7º e 8º Horários (12:30 - 14:10)' },
  { nome: '5º Bloco', horarios: [9, 10], label: '9º e 10º Horários (14:10 - 16:00)' },
  { nome: '6º Bloco', horarios: [11, 12], label: '11º e 12º Horários (16:00 - 17:40)' }
];

@Component({
  selector: 'app-agendamento',
  templateUrl: './agendamento.page.html',
  styleUrls: ['./agendamento.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class AgendamentoPage implements OnInit {
  salas: Sala[] = [];
  salaSelecionada: number | null = null;
  dataSelecionada: string = '';
  horarios = HORARIOS;
  grupos = GRUPOS_HORARIOS;
  gruposDisponiveis: any[] = [];
  grupoSelecionado: any = null;
  motivo: string = '';
  loading = true;
  salvando = false;
  userName: string = '';

  constructor(
    private salaService: SalaService,
    private reservaService: ReservaService,
    private disponibilidadeService: DisponibilidadeService,
    private logService: LogService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      calendarOutline,
      timeOutline,
      businessOutline,
      checkmarkCircleOutline,
      documentTextOutline
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  ionViewWillEnter() {
    this.carregarDados();
  }

  async carregarDados() {
    this.loading = true;
    
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.nome || user.email?.split('@')[0] || 'Usuário';
    }
    
    this.salaService.getSalas().subscribe({
      next: (salas) => {
        this.salas = salas.filter(s => s.ativa);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar salas:', err);
        this.loading = false;
      }
    });
  }

  onSalaSelecionada() {
    this.grupoSelecionado = null;
    this.gruposDisponiveis = [];
    if (this.dataSelecionada) {
      this.carregarDisponibilidade();
    }
  }

  onDataSelecionada(event: any) {
    const valor = event.detail.value;
    
    if (!valor) {
      this.dataSelecionada = '';
      this.grupoSelecionado = null;
      this.gruposDisponiveis = [];
      return;
    }
    
    if (valor.includes('T')) {
      this.dataSelecionada = valor.split('T')[0];
    } else {
      this.dataSelecionada = valor;
    }
    
    this.grupoSelecionado = null;
    this.gruposDisponiveis = [];
    
    if (this.salaSelecionada) {
      this.carregarDisponibilidade();
    }
  }

  async carregarDisponibilidade() {
    if (!this.salaSelecionada || !this.dataSelecionada) return;
    
    const data = new Date(this.dataSelecionada);
    const diaSemana = data.getDay();
    
    if (diaSemana === 0 || diaSemana === 6) {
      this.gruposDisponiveis = [];
      this.presentToast('Fim de semana não possui horários disponíveis', 'warning');
      return;
    }
    
    this.disponibilidadeService.getDisponibilidadesPorSala(this.salaSelecionada).subscribe({
      next: (disponibilidades) => {
        const disp = disponibilidades.find(d => d.diaSemana === diaSemana);
        if (!disp || !disp.ativo || !disp.horarios.length) {
          this.gruposDisponiveis = [];
          this.presentToast('Esta sala não possui horários disponíveis para este dia', 'warning');
          return;
        }
        
        const horariosDisponiveis = disp.horarios;
        
        this.reservaService.getReservasPorSalaEData(this.salaSelecionada!, this.dataSelecionada).then(reservas => {
          const horariosOcupados = reservas.map(r => r.horario);
          
          this.gruposDisponiveis = this.grupos.filter(grupo => {
            return grupo.horarios.every((h: number) => 
              horariosDisponiveis.includes(h) && !horariosOcupados.includes(h)
            );
          });
          
          if (this.gruposDisponiveis.length === 0) {
            this.presentToast('Nenhum bloco de horários disponível para esta data', 'warning');
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar disponibilidade:', err);
        this.gruposDisponiveis = [];
      }
    });
  }

  getHorarioLabel(numero: number): string {
    const horario = this.horarios.find(h => h.numero === numero);
    return horario?.label || `${numero}º Horário`;
  }

  getGrupoLabel(grupo: any): string {
    return grupo.label;
  }

  getDataMinima(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  getDataMaxima(): string {
    const data = new Date();
    data.setDate(data.getDate() + 30);
    return data.toISOString().split('T')[0];
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  async confirmarAgendamento() {
    if (!this.salaSelecionada) {
      this.presentToast('Selecione uma sala', 'warning');
      return;
    }
    if (!this.dataSelecionada) {
      this.presentToast('Selecione uma data', 'warning');
      return;
    }
    if (!this.grupoSelecionado) {
      this.presentToast('Selecione um bloco de horários', 'warning');
      return;
    }

    const sala = this.salas.find(s => s.id === this.salaSelecionada);
    const user = this.authService.getCurrentUser();
    
    if (!user || !sala) return;

    let mensagem = `Sala: ${sala.nome}\n`;
    mensagem += `Data: ${this.formatarData(this.dataSelecionada)}\n`;
    mensagem += `Bloco: ${this.grupoSelecionado.label}\n`;
    if (this.motivo) {
      mensagem += `Motivo: ${this.motivo}\n`;
    }
    mensagem += `\nConfirmar este agendamento?`;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Agendamento',
      message: mensagem,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => this.realizarAgendamento(sala, user)
        }
      ]
    });
    await alert.present();
  }

  async realizarAgendamento(sala: Sala, user: any) {
    this.salvando = true;
    
    try {
      const horariosParaReservar: number[] = this.grupoSelecionado.horarios;
      
      const reservasDoUsuario = await this.reservaService.getReservasDoUsuarioPorData(
        user.id,
        this.dataSelecionada
      );
      
      const horariosUsuarioOcupados: number[] = reservasDoUsuario.map((r: any) => r.horario);
      const horariosConflitantes: number[] = horariosParaReservar.filter((h: number) => horariosUsuarioOcupados.includes(h));
      
      if (horariosConflitantes.length > 0) {
        const horariosTexto: string = horariosConflitantes.map((h: number) => this.getHorarioLabel(h)).join(', ');
        this.presentToast(`Você já tem agendamento(s) no(s) horário(s): ${horariosTexto}. Não é possível reservar dois ambientes no mesmo horário.`, 'danger');
        this.salvando = false;
        return;
      }
      
      const reservasSemana: number = await this.reservaService.contarReservasSemanais(user.id, new Date(this.dataSelecionada));
      const LIMITE_SEMANAL: number = 10;
      
      if (reservasSemana + horariosParaReservar.length > LIMITE_SEMANAL) {
        const restantes: number = LIMITE_SEMANAL - reservasSemana;
        this.presentToast(`Limite semanal: você já tem ${reservasSemana} agendamento(s) esta semana. Restam ${restantes} vaga(s).`, 'warning');
        this.salvando = false;
        return;
      }
      
      const reservasExistentes = await this.reservaService.getReservasPorSalaEData(
        this.salaSelecionada!, 
        this.dataSelecionada
      );
      
      const horariosOcupados: number[] = reservasExistentes.map((r: any) => r.horario);
      const horariosOcupadosNoBloco: number[] = horariosParaReservar.filter((h: number) => horariosOcupados.includes(h));
      
      if (horariosOcupadosNoBloco.length > 0) {
        const ocupadosTexto: string = horariosOcupadosNoBloco.map((h: number) => this.getHorarioLabel(h)).join(', ');
        this.presentToast(`Os horários ${ocupadosTexto} já estão ocupados nesta sala. Por favor, escolha outro bloco.`, 'danger');
        this.salvando = false;
        this.carregarDisponibilidade();
        return;
      }
      
      for (const horario of horariosParaReservar) {
        const reservaData: any = {
          salaId: sala.id!,
          salaNome: sala.nome,
          usuarioId: user.id,
          usuarioNome: this.userName,
          data: this.dataSelecionada,
          horario: horario,
          status: 'confirmada',
          createdAt: new Date()
        };
        
        if (this.motivo && this.motivo.trim()) {
          reservaData.motivo = this.motivo.trim();
        }
        
        await this.reservaService.addReserva(reservaData);
      }
      
      await this.logService.registrarLog('AGENDAMENTO_CRIADO', {
        salaId: sala.id,
        salaNome: sala.nome,
        data: this.dataSelecionada,
        horarios: horariosParaReservar,
        motivo: this.motivo
      });
      
      this.presentToast('Agendamento realizado com sucesso!', 'success');
      this.limparFormulario();
      
    } catch (error) {
      console.error('Erro ao realizar agendamento:', error);
      this.presentToast('Erro ao realizar agendamento', 'danger');
    } finally {
      this.salvando = false;
    }
  }

  limparFormulario() {
    this.salaSelecionada = null;
    this.dataSelecionada = '';
    this.grupoSelecionado = null;
    this.motivo = '';
    this.gruposDisponiveis = [];
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}