import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  timeOutline,
  businessOutline,
  personOutline,
  documentTextOutline,
  closeOutline,
  refreshOutline,
  filterOutline,
  printOutline,
  downloadOutline,
  eyeOutline
} from 'ionicons/icons';

interface ReservaDetalhada {
  id: number;
  salaNome: string;
  salaTipo: string;
  salaCapacidade: number;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioTipo: string;
  data: string;
  horario: number;
  status: string;
  motivo?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-visualizacao-detalhada',
  templateUrl: './visualizacao-detalhada.page.html',
  styleUrls: ['./visualizacao-detalhada.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class VisualizacaoDetalhadaPage implements OnInit {
  reservas: ReservaDetalhada[] = [];
  reservasFiltradas: ReservaDetalhada[] = [];
  loading = true;
  reservaSelecionada: ReservaDetalhada | null = null;
  
  dataInicio: string = '';
  dataFim: string = '';
  salaFiltro: string = '';
  statusFiltro: string = 'todos';
  usuarioFiltro: string = '';
  
  salas: string[] = [];
  usuarios: string[] = [];
  
  userTipo: string = '';

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      calendarOutline,
      timeOutline,
      businessOutline,
      personOutline,
      documentTextOutline,
      closeOutline,
      refreshOutline,
      filterOutline,
      printOutline,
      downloadOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.carregarReservas();
  }

  ionViewWillEnter() {
    this.carregarReservas();
  }

  async carregarReservas() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      this.userTipo = user.tipo || '';
      
      let params: any = { orderBy: 'data', order: 'DESC' };
      
      if (this.userTipo !== 'Diretor' && this.userTipo !== 'Chefe de TI' && this.userTipo !== 'Coordenador') {
        params.usuarioId = user.id;
      }
      
      const reservas = await this.api.getWithQuery('reservas', params);
      
      this.reservas = [];
      for (const r of reservas) {
        let salaTipo = '';
        let salaCapacidade = 0;
        try {
          const sala = await this.api.getById('salas', r.salaId);
          if (sala) {
            salaTipo = sala.tipoAmbiente || '';
            salaCapacidade = sala.capacidade || 0;
          }
        } catch (error) {
          console.error('Erro ao buscar sala:', error);
        }
        
        let usuarioEmail = '';
        let usuarioTipo = '';
        try {
          const funcionario = await this.api.getById('funcionarios', r.usuarioId);
          if (funcionario) {
            usuarioEmail = funcionario.email || '';
            usuarioTipo = funcionario.tipo || '';
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
        }
        
        this.reservas.push({
          id: r.id,
          salaNome: r.salaNome,
          salaTipo: salaTipo,
          salaCapacidade: salaCapacidade,
          usuarioNome: r.usuarioNome,
          usuarioEmail: usuarioEmail,
          usuarioTipo: usuarioTipo,
          data: r.data,
          horario: r.horario,
          status: r.status,
          motivo: r.motivo,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
        });
      }
      
      this.salas = [...new Set(this.reservas.map(r => r.salaNome))].sort();
      this.usuarios = [...new Set(this.reservas.map(r => r.usuarioNome))].sort();
      
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      this.presentToast('Erro ao carregar agendamentos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    let filtradas = [...this.reservas];
    
    if (this.dataInicio) {
      filtradas = filtradas.filter(r => r.data >= this.dataInicio);
    }
    if (this.dataFim) {
      filtradas = filtradas.filter(r => r.data <= this.dataFim);
    }
    if (this.salaFiltro) {
      filtradas = filtradas.filter(r => r.salaNome === this.salaFiltro);
    }
    if (this.statusFiltro !== 'todos') {
      filtradas = filtradas.filter(r => r.status === this.statusFiltro);
    }
    if (this.usuarioFiltro && (this.userTipo === 'Diretor' || this.userTipo === 'Chefe de TI' || this.userTipo === 'Coordenador')) {
      filtradas = filtradas.filter(r => r.usuarioNome === this.usuarioFiltro);
    }
    
    this.reservasFiltradas = filtradas;
  }

  limparFiltros() {
    this.dataInicio = '';
    this.dataFim = '';
    this.salaFiltro = '';
    this.statusFiltro = 'todos';
    this.usuarioFiltro = '';
    this.aplicarFiltros();
  }

  refresh() {
    this.carregarReservas();
  }

  abrirDetalhes(reserva: ReservaDetalhada) {
    this.reservaSelecionada = reserva;
  }

  fecharDetalhes() {
    this.reservaSelecionada = null;
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

  getStatusColor(status: string): string {
    switch(status) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'danger';
      default: return 'warning';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'confirmada': return 'Confirmada';
      case 'cancelada': return 'Cancelada';
      default: return 'Pendente';
    }
  }

  getTipoLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'sala': 'Sala de Aula',
      'laboratorio': 'Laboratório',
      'auditorio': 'Auditório',
      'sala_video': 'Sala de Vídeo',
      'sala_informatica': 'Sala de Informática',
      'biblioteca': 'Biblioteca',
      'quadra': 'Quadra Esportiva'
    };
    return tipos[tipo] || tipo;
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