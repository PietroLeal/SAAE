import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ModalController, PopoverController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  notificationsOutline, 
  personCircleOutline, 
  calendarOutline, 
  closeCircleOutline, 
  barChartOutline, 
  searchOutline, 
  peopleCircleOutline, 
  peopleOutline, 
  documentTextOutline, 
  buildOutline, 
  calendarClearOutline, 
  keyOutline, 
  cubeOutline, 
  folderOpenOutline,
  trashOutline,
  logOutOutline,
  sunnyOutline,
  partlySunnyOutline,
  moonOutline,
  happyOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { PermissaoService, Permissoes } from '../services/permissao.service';
import { RefreshService } from '../services/refresh.service';

interface Reserva {
  id: number;
  salaNome: string;
  data: string;
  horario: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent],
})
export class DashboardPage implements OnInit {
  permissoes: Permissoes | null = null;
  recentBookings: Reserva[] = [];
  userName: string = '';
  userEmail: string = '';
  userRole: string = '';
  dadosCarregados = false;
  mensagemDoDia: string = '';

  constructor(
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private authService: AuthService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private permissaoService: PermissaoService,
    private refreshService: RefreshService
  ) {
    addIcons({
      notificationsOutline,
      personCircleOutline,
      calendarOutline,
      closeCircleOutline,
      barChartOutline,
      searchOutline,
      peopleCircleOutline,
      peopleOutline,
      documentTextOutline,
      buildOutline,
      calendarClearOutline,
      keyOutline,
      cubeOutline,
      folderOpenOutline,
      trashOutline,
      logOutOutline,
      sunnyOutline,
      partlySunnyOutline,
      moonOutline,
      happyOutline
    });
  }

  async ngOnInit() {
    this.refreshService.refresh$.subscribe(async () => {
      console.log('🔄 Recarregando permissões no dashboard...');
      this.permissoes = await this.permissaoService.refreshPermissoes();
      this.cdr.detectChanges();
    });
    
    this.permissoes = await this.permissaoService.getPermissoesDoUsuario();
    await this.carregarDados();
    await this.carregarReservas();
    this.definirMensagemDoDia();
    this.dadosCarregados = true;
    this.cdr.detectChanges();
  }

  ionViewWillEnter() {
    this.carregarReservas();
  }

  definirMensagemDoDia() {
    const hora = new Date().getHours();
    
    if (hora >= 5 && hora < 12) {
      this.mensagemDoDia = 'Inicie suas atividades e verifique sua agenda.';
    } else if (hora >= 12 && hora < 18) {
      this.mensagemDoDia = 'Conclua as tarefas pendentes da manhã.';
    } else {
      this.mensagemDoDia = 'Prepare os agendamentos para amanhã.';
    }
  }

  getSaudacao(): string {
    const hora = new Date().getHours();
    
    if (hora >= 5 && hora < 12) {
      return 'Bom dia';
    } else if (hora >= 12 && hora < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  }

  getDataFormatada(): string {
    const hoje = new Date();
    const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const diaSemana = dias[hoje.getDay()];
    const dia = hoje.getDate();
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();
    
    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
  }

  getIconeSaudacao(): string {
    const hora = new Date().getHours();
    
    if (hora >= 5 && hora < 12) {
      return 'sunny-outline';
    } else if (hora >= 12 && hora < 18) {
      return 'partly-sunny-outline';
    } else {
      return 'moon-outline';
    }
  }

  async carregarDados() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email || '';
      this.userName = user.nome || user.email?.split('@')[0] || 'Usuário';
      this.userRole = user.tipo || '';
      this.cdr.detectChanges();
    }
  }

  async carregarReservas() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      const reservas = await this.api.getWithQuery('reservas', { usuarioId: user.id });
      
      this.recentBookings = reservas.map((r: any) => ({
        id: r.id,
        salaNome: r.salaNome || 'Ambiente',
        data: r.data,
        horario: r.horario,
        status: r.status || 'confirmada'
      }));
      
      this.recentBookings.sort((a, b) => {
        if (a.data !== b.data) {
          return a.data > b.data ? -1 : 1;
        }
        return a.horario - b.horario;
      });
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    }
  }

  formatarData(data: string): string {
    if (!data) return '';
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

  async removerReserva(index: number) {
    const reserva = this.recentBookings[index];
    if (!reserva) return;

    try {
      await this.api.update('reservas', reserva.id, { status: 'cancelada' });
      this.recentBookings.splice(index, 1);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro ao remover reserva:', error);
    }
  }

  async openUserProfile(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: ProfileMenuComponent,
      event: event,
      mode: 'ios',
      cssClass: 'profile-popover',
      backdropDismiss: true,
      showBackdrop: true,
      translucent: false
    });
    await popover.present();
  }

  async checkNotifications() {
    this.navCtrl.navigateForward('/notificacoes');
  }

  openScheduling() {
    this.navCtrl.navigateForward('/agendamento');
  }

  cancelBooking() {
    this.navCtrl.navigateForward('/cancelar-agendamento');
  }

  openGerenciarSalas() {
    this.navCtrl.navigateForward('/gerenciar-salas');
  }

  openGerenciarDisponibilidade() {
    this.navCtrl.navigateForward('/gerenciar-disponibilidade');
  }

  viewReports() {
    this.navCtrl.navigateForward('/relatorios');
  }

  openConsultaGeral() {
    this.navCtrl.navigateForward('/consulta-agendamentos');
  }

  openGestaoProfessores() {
    this.navCtrl.navigateForward('/usuarios');
  }

  manageUsers() {
    this.navCtrl.navigateForward('/usuarios');
  }

  openDetalhesAgendamentos() {
    this.navCtrl.navigateForward('/visualizacao-detalhada');
  }

  viewLogs() {
    this.navCtrl.navigateForward('/logs');
  }

  generateReports() {
    this.navCtrl.navigateForward('/relatorios');
  }

  openPerfis() {
    this.navCtrl.navigateForward('/perfis');
  }

  openPermissoes() {
    this.navCtrl.navigateForward('/perfis');
  }

  openRecursos() {
    this.navCtrl.navigateForward('/recursos');
  }
}