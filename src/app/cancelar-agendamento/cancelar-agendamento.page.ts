import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, NavController } from '@ionic/angular';
import { ReservaService, Reserva } from '../services/reserva.service';
import { LogService } from '../services/log.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  trashOutline,
  calendarOutline,
  timeOutline,
  businessOutline,
  alertCircleOutline,
  addOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-cancelar-agendamento',
  templateUrl: './cancelar-agendamento.page.html',
  styleUrls: ['./cancelar-agendamento.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class CancelarAgendamentoPage implements OnInit {
  reservas: Reserva[] = [];
  loading = true;
  cancelando = false;

  constructor(
    private reservaService: ReservaService,
    private logService: LogService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({
      trashOutline,
      calendarOutline,
      timeOutline,
      businessOutline,
      alertCircleOutline,
      addOutline
    });
  }

  ngOnInit() {
    this.carregarReservas();
  }

  ionViewWillEnter() {
    this.carregarReservas();
  }

  carregarReservas() {
    this.loading = true;
    this.reservaService.getReservasDoUsuario().subscribe({
      next: (reservas) => {
        this.reservas = reservas.filter(r => r.status !== 'cancelada');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar reservas:', err);
        this.loading = false;
      }
    });
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
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

  async confirmarCancelamento(reserva: Reserva) {
    let mensagem = `Sala: ${reserva.salaNome}\n`;
    mensagem += `Data: ${this.formatarData(reserva.data)}\n`;
    mensagem += `Horário: ${this.getHorarioLabel(reserva.horario)}\n\n`;
    mensagem += `Tem certeza que deseja cancelar este agendamento?`;

    const alert = await this.alertCtrl.create({
      header: 'Cancelar Agendamento',
      message: mensagem,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: 'Cancelar Agendamento',
          handler: () => this.cancelarReserva(reserva)
        }
      ]
    });
    await alert.present();
  }

  async cancelarReserva(reserva: Reserva) {
    this.cancelando = true;
    
    try {
      await this.reservaService.cancelarReserva(reserva.id!);
      
      await this.logService.registrarLog('AGENDAMENTO_CANCELADO', {
        reservaId: reserva.id,
        salaNome: reserva.salaNome,
        data: reserva.data,
        horario: reserva.horario
      });
      
      this.presentToast('Agendamento cancelado com sucesso!', 'success');
      this.carregarReservas();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      this.presentToast('Erro ao cancelar agendamento', 'danger');
    } finally {
      this.cancelando = false;
    }
  }

  irParaAgendamento() {
    this.navCtrl.navigateForward('/agendamento');
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