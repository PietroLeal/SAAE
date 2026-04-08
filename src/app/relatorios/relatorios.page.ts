import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  barChartOutline,
  calendarOutline,
  timeOutline,
  businessOutline,
  downloadOutline,
  filterOutline,
  closeOutline,
  personOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';

interface ReservaRelatorio {
  id: number;
  salaNome: string;
  usuarioNome: string;
  data: string;
  horario: number;
  status: string;
  motivo?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class RelatoriosPage implements OnInit {
  reservas: ReservaRelatorio[] = [];
  reservasFiltradas: ReservaRelatorio[] = [];
  loading = true;
  
  dataInicio: string = '';
  dataFim: string = '';
  salaFiltro: string = '';
  statusFiltro: string = 'todos';
  salas: string[] = [];
  
  totalReservas = 0;
  reservasConfirmadas = 0;
  reservasCanceladas = 0;
  
  horarios = [
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

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      barChartOutline,
      calendarOutline,
      timeOutline,
      businessOutline,
      downloadOutline,
      filterOutline,
      closeOutline,
      personOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.carregarRelatorios();
  }

  ionViewWillEnter() {
    this.carregarRelatorios();
  }

  async carregarRelatorios() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      let params: any = { orderBy: 'data', order: 'DESC' };
      
      if (user.tipo !== 'Diretor' && user.tipo !== 'Chefe de TI' && user.tipo !== 'Coordenador') {
        params.usuarioId = user.id;
      }
      
      const reservas = await this.api.getWithQuery('reservas', params);
      
      this.reservas = reservas.map((r: any) => ({
        id: r.id,
        salaNome: r.salaNome,
        usuarioNome: r.usuarioNome,
        data: r.data,
        horario: r.horario,
        status: r.status,
        motivo: r.motivo,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
      }));
      
      this.salas = [...new Set(this.reservas.map(r => r.salaNome))].sort();
      
      this.calcularEstatisticas();
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      this.presentToast('Erro ao carregar relatórios', 'danger');
    } finally {
      this.loading = false;
    }
  }

  calcularEstatisticas() {
    this.totalReservas = this.reservas.length;
    this.reservasConfirmadas = this.reservas.filter(r => r.status === 'confirmada').length;
    this.reservasCanceladas = this.reservas.filter(r => r.status === 'cancelada').length;
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
    
    this.reservasFiltradas = filtradas;
  }

  limparFiltros() {
    this.dataInicio = '';
    this.dataFim = '';
    this.salaFiltro = '';
    this.statusFiltro = 'todos';
    this.aplicarFiltros();
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  getHorarioLabel(horario: number): string {
    return this.horarios[horario - 1] || `${horario}º Horário`;
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

  async exportarCSV() {
    if (this.reservasFiltradas.length === 0) {
      this.presentToast('Não há dados para exportar', 'warning');
      return;
    }

    if (this.statusFiltro === 'todos') {
      const confirmadas = this.reservasFiltradas.filter(r => r.status === 'confirmada');
      const canceladas = this.reservasFiltradas.filter(r => r.status === 'cancelada');
      
      let html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Agendamentos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #0052d4; border-bottom: 2px solid #0052d4; padding-bottom: 10px; }
            h2 { color: #333; margin-top: 30px; }
            .section { margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #0052d4; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .stats span { font-weight: bold; color: #0052d4; }
          </style>
        </head>
        <body>
          <h1>Relatório de Agendamentos</h1>
          <div class="stats">
            <strong>Período:</strong> ${this.dataInicio || 'Todas'} até ${this.dataFim || 'Todas'} | 
            <strong>Total:</strong> ${this.reservasFiltradas.length} | 
            <strong>Confirmadas:</strong> ${confirmadas.length} | 
            <strong>Canceladas:</strong> ${canceladas.length}
          </div>
      `;
      
      if (confirmadas.length > 0) {
        html += `
          <div class="section">
            <h2>✅ Reservas Confirmadas (${confirmadas.length})</h2>
            <table>
              <tr>
                <th>Sala</th>
                <th>Usuário</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Motivo</th>
              </tr>
              ${confirmadas.map(r => `
                <tr>
                  <td>${r.salaNome}</td>
                  <td>${r.usuarioNome}</td>
                  <td>${this.formatarData(r.data)}</td>
                  <td>${this.getHorarioLabel(r.horario)}</td>
                  <td>${r.motivo || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      }
      
      if (canceladas.length > 0) {
        html += `
          <div class="section">
            <h2>❌ Reservas Canceladas (${canceladas.length})</h2>
            <table>
              <tr>
                <th>Sala</th>
                <th>Usuário</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Motivo</th>
              </tr>
              ${canceladas.map(r => `
                <tr>
                  <td>${r.salaNome}</td>
                  <td>${r.usuarioNome}</td>
                  <td>${this.formatarData(r.data)}</td>
                  <td>${this.getHorarioLabel(r.horario)}</td>
                  <td>${r.motivo || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      }
      
      html += `
          <div class="footer">
            Relatório gerado em ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
        </html>
      `;
      
      this.baixarArquivo(html, `relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.html`, 'text/html');
      
    } else {
      let csv = '\uFEFF';
      csv += '"Sala";"Usuário";"Data";"Horário";"Status";"Motivo"\n';
      
      for (const r of this.reservasFiltradas) {
        csv += `"${r.salaNome}";`;
        csv += `"${r.usuarioNome}";`;
        csv += `"${this.formatarData(r.data)}";`;
        csv += `"${this.getHorarioLabel(r.horario)}";`;
        csv += `"${r.status === 'confirmada' ? 'Confirmada' : r.status === 'cancelada' ? 'Cancelada' : 'Pendente'}";`;
        csv += `"${r.motivo || ''}"\n`;
      }
      
      this.baixarArquivo(csv, `relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    }
  }

  baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
    const blob = new Blob([conteudo], { type: tipo });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.presentToast('Relatório exportado com sucesso!', 'success');
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