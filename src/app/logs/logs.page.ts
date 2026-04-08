import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { LogService, Log } from '../services/log.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  listOutline,
  personOutline,
  calendarOutline,
  timeOutline,
  trashOutline,
  createOutline,
  refreshOutline,
  filterOutline,
  closeOutline,
  businessOutline,
  logInOutline,
  logOutOutline,
  documentTextOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.page.html',
  styleUrls: ['./logs.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class LogsPage implements OnInit {
  logs: Log[] = [];
  logsFiltrados: Log[] = [];
  loading = true;
  
  acaoFiltro: string = '';
  dataInicio: string = '';
  dataFim: string = '';
  usuarioFiltro: string = '';
  
  acoes = [
    { valor: '', nome: 'Todas' },
    { valor: 'AGENDAMENTO_CRIADO', nome: 'Agendamentos Criados' },
    { valor: 'AGENDAMENTO_CANCELADO', nome: 'Agendamentos Cancelados' },
    { valor: 'SALA_CRIADA', nome: 'Salas Criadas' },
    { valor: 'SALA_ATUALIZADA', nome: 'Salas Atualizadas' },
    { valor: 'SALA_EXCLUIDA', nome: 'Salas Excluídas' },
    { valor: 'DISPONIBILIDADE_CRIADA', nome: 'Disponibilidades Criadas' },
    { valor: 'DISPONIBILIDADE_ATUALIZADA', nome: 'Disponibilidades Atualizadas' },
    { valor: 'DISPONIBILIDADE_EXCLUIDA', nome: 'Disponibilidades Excluídas' },
    { valor: 'LOGIN', nome: 'Logins' },
    { valor: 'LOGOUT', nome: 'Logouts' }
  ];
  
  usuarios: string[] = [];
  userTipo: string = '';

  constructor(
    private logService: LogService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      listOutline,
      personOutline,
      calendarOutline,
      timeOutline,
      trashOutline,
      createOutline,
      refreshOutline,
      filterOutline,
      closeOutline,
      businessOutline,
      logInOutline,
      logOutOutline,
      documentTextOutline
    });
  }

  ngOnInit() {
    this.carregarLogs();
  }

  ionViewWillEnter() {
    this.carregarLogs();
  }

  async carregarLogs() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      this.userTipo = user.tipo || '';
      
      if (this.userTipo !== 'Diretor' && this.userTipo !== 'Chefe de TI') {
        this.logs = await this.logService.getLogsPorUsuario(user.id, 500);
      } else {
        this.logs = await this.logService.getLogs(500);
      }
      
      this.usuarios = [...new Set(this.logs.map(l => l.usuarioNome))].sort();
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      this.presentToast('Erro ao carregar logs', 'danger');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    let filtrados = [...this.logs];
    
    if (this.acaoFiltro) {
      filtrados = filtrados.filter(l => l.acao === this.acaoFiltro);
    }
    
    if (this.dataInicio) {
      const dataInicioObj = new Date(this.dataInicio);
      filtrados = filtrados.filter(l => new Date(l.data) >= dataInicioObj);
    }
    
    if (this.dataFim) {
      const dataFimObj = new Date(this.dataFim);
      dataFimObj.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(l => new Date(l.data) <= dataFimObj);
    }
    
    if (this.usuarioFiltro) {
      filtrados = filtrados.filter(l => l.usuarioNome === this.usuarioFiltro);
    }
    
    this.logsFiltrados = filtrados;
  }

  limparFiltros() {
    this.acaoFiltro = '';
    this.dataInicio = '';
    this.dataFim = '';
    this.usuarioFiltro = '';
    this.aplicarFiltros();
  }

  refresh() {
    this.carregarLogs();
  }

  getAcaoLabel(acao: string): string {
    const acaoObj = this.acoes.find(a => a.valor === acao);
    return acaoObj?.nome || acao;
  }

  getAcaoIcon(acao: string): string {
    if (acao.includes('AGENDAMENTO')) return 'calendar-outline';
    if (acao.includes('SALA')) return 'business-outline';
    if (acao.includes('DISPONIBILIDADE')) return 'time-outline';
    if (acao.includes('LOGIN')) return 'log-in-outline';
    if (acao.includes('LOGOUT')) return 'log-out-outline';
    return 'list-outline';
  }

  getAcaoColor(acao: string): string {
    if (acao.includes('CRIADO')) return 'success';
    if (acao.includes('ATUALIZADO')) return 'warning';
    if (acao.includes('EXCLUIDO') || acao.includes('CANCELADO')) return 'danger';
    return 'primary';
  }

  formatarData(data: Date): string {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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