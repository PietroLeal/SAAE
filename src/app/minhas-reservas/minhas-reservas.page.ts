import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  timeOutline,
  businessOutline,
  trashOutline,
  refreshOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  warningOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { LogService } from '../services/log.service';
import { NotificationService } from '../services/notificacao.service';

interface Reserva {
  id: number;
  salaId: number;
  salaNome: string;
  usuarioId: number;
  usuarioNome: string;
  data: string;
  horario: number;
  status: string;
  motivo?: string;
  createdAt: string;
}

@Component({
  selector: 'app-minhas-reservas',
  templateUrl: './minhas-reservas.page.html',
  styleUrls: ['./minhas-reservas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class MinhasReservasPage implements OnInit {
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  loading = true;
  user: any = null;
  
  filtroStatus: string = 'todas';
  filtroData: string = '';
  
  statusOptions = [
    { valor: 'todas', label: 'Todas', icon: 'information-circle-outline' },
    { valor: 'confirmada', label: 'Confirmadas', icon: 'checkmark-circle-outline' },
    { valor: 'cancelada', label: 'Canceladas', icon: 'close-circle-outline' },
    { valor: 'pendente', label: 'Pendentes', icon: 'warning-outline' }
  ];

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
    private modalCtrl: ModalController,
    private logService: LogService,
    private notificationService: NotificationService
  ) {
    addIcons({
      calendarOutline,
      timeOutline,
      businessOutline,
      trashOutline,
      refreshOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      warningOutline,
      informationCircleOutline
    });
  }

  async ngOnInit() {
    this.user = this.authService.getCurrentUser();
    await this.carregarReservas();
  }

  ionViewWillEnter() {
    this.carregarReservas();
  }

  async carregarReservas() {
    if (!this.user) {
      this.user = this.authService.getCurrentUser();
      if (!this.user) return;
    }
    
    this.loading = true;
    
    try {
      const reservas = await this.api.getWithQuery('reservas', { usuarioId: this.user.id });
      
      this.reservas = reservas.map((r: any) => ({
        ...r,
        data: r.data ? r.data.split('T')[0] : r.data
      }));
      
      this.reservas.sort((a, b) => {
        if (a.data !== b.data) {
          return b.data.localeCompare(a.data);
        }
        return b.horario - a.horario;
      });
      
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      this.presentToast('Erro ao carregar reservas', 'danger');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    let filtradas = [...this.reservas];
    
    if (this.filtroStatus !== 'todas') {
      filtradas = filtradas.filter(r => r.status === this.filtroStatus);
    }
    
    if (this.filtroData) {
      filtradas = filtradas.filter(r => r.data === this.filtroData);
    }
    
    this.reservasFiltradas = filtradas;
  }

  onFiltroStatusChange() {
    this.aplicarFiltros();
  }

  onFiltroDataChange() {
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.filtroStatus = 'todas';
    this.filtroData = '';
    this.aplicarFiltros();
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  getHorarioLabel(horario: number): string {
    const horarios: { [key: number]: string } = {
      1: '07:00 - 07:50',
      2: '07:50 - 08:40',
      3: '08:50 - 09:40',
      4: '09:40 - 10:30',
      5: '10:30 - 11:20',
      6: '11:20 - 12:10',
      7: '12:30 - 13:20',
      8: '13:20 - 14:10',
      9: '14:10 - 15:00',
      10: '15:10 - 16:00',
      11: '16:00 - 16:50',
      12: '16:50 - 17:40'
    };
    return horarios[horario] || `${horario}º Horário`;
  }

  getHorarioNumero(horario: number): string {
    return `${horario}º Horário`;
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'danger';
      case 'pendente': return 'warning';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmada': return 'Confirmada';
      case 'cancelada': return 'Cancelada';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  }

  podeCancelar(reserva: Reserva): boolean {
    if (reserva.status === 'cancelada') return false;
    
    const dataReserva = new Date(reserva.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return dataReserva >= hoje;
  }

  async cancelarReserva(reserva: Reserva) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Reserva',
      message: `Tem certeza que deseja cancelar a reserva da sala "${reserva.salaNome}" para o dia ${this.formatarData(reserva.data)} no ${this.getHorarioLabel(reserva.horario)}?`,
      buttons: [
        { text: 'Não', role: 'cancel' },
        { 
          text: 'Sim, cancelar', 
          role: 'destructive',
          handler: () => this.confirmarCancelamento(reserva)
        }
      ]
    });
    await alert.present();
  }

  async confirmarCancelamento(reserva: Reserva) {
    try {
      await this.api.update('reservas', reserva.id, { status: 'cancelada' });
      
      reserva.status = 'cancelada';
      this.aplicarFiltros();
      
      await this.logService.registrarLog('RESERVA_CANCELADA', {
        reservaId: reserva.id,
        salaNome: reserva.salaNome,
        data: reserva.data,
        horario: reserva.horario
      });
      
      await this.notificationService.notificarReservaCancelada(
        reserva.salaNome, 
        reserva.data, 
        reserva.horario
      );
      
      this.presentToast('Reserva cancelada com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      this.presentToast('Erro ao cancelar reserva', 'danger');
    }
  }

  async verDetalhes(reserva: Reserva) {
  let mensagem = `📋 DETALHES DA RESERVA\n\n`;
  mensagem += `🏫 Sala: ${reserva.salaNome}\n`;
  mensagem += `📅 Data: ${this.formatarData(reserva.data)}\n`;
  mensagem += `⏰ Horário: ${this.getHorarioLabel(reserva.horario)} (${this.getHorarioNumero(reserva.horario)})\n`;
  mensagem += `📌 Status: ${this.getStatusLabel(reserva.status)}\n`;
  
  if (reserva.motivo) {
    mensagem += `📝 Motivo: ${reserva.motivo}\n`;
  }
  
  mensagem += `🕐 Reservado em: ${new Date(reserva.createdAt).toLocaleString()}`;
  
  const alert = await this.alertCtrl.create({
    header: 'Detalhes da Reserva',
    message: mensagem,
    buttons: ['OK']
  });
  await alert.present();
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

  voltar() {
    this.router.navigate(['/dashboard']);
  }

  agendarNova() {
    this.router.navigate(['/agendamento']);
  }
}