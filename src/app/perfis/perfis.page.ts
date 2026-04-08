import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { RefreshService } from '../services/refresh.service';
import { addIcons } from 'ionicons';
import { 
  peopleOutline,
  shieldOutline,
  createOutline,
  closeOutline,
  refreshOutline,
  checkmarkOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { NavController } from '@ionic/angular';

interface Permissao {
  nome: string;
  chave: string;
  descricao: string;
}

import { PermissaoService } from '../services/permissao.service';

interface PerfilPermissoes {
  perfil: string;
  permissoes: { [key: string]: boolean };
}

@Component({
  selector: 'app-perfis',
  templateUrl: './perfis.page.html',
  styleUrls: ['./perfis.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class PerfisPage implements OnInit {
  perfis = [
    'Professor',
    'Funcionário Administrativo',
    'Coordenador',
    'Diretor'
  ]; // Chefe de TI nn ta aqui pq ele é o goat
  
  permissoesDisponiveis: Permissao[] = [
    { nome: 'Ver Dashboard', chave: 'verDashboard', descricao: 'Acessar a página principal' },
    { nome: 'Agendar Sala', chave: 'agendarSala', descricao: 'Fazer reservas de salas' },
    { nome: 'Cancelar Agendamento', chave: 'cancelarAgendamento', descricao: 'Cancelar suas próprias reservas' },
    { nome: 'Ver Salas', chave: 'verSalas', descricao: 'Visualizar lista de salas' },
    { nome: 'Gerenciar Salas', chave: 'gerenciarSalas', descricao: 'Criar, editar e excluir salas' },
    { nome: 'Gerenciar Disponibilidade', chave: 'gerenciarDisponibilidade', descricao: 'Definir horários das salas' },
    { nome: 'Ver Usuários', chave: 'verUsuarios', descricao: 'Visualizar lista de funcionários' },
    { nome: 'Gerenciar Usuários', chave: 'gerenciarUsuarios', descricao: 'Editar e excluir funcionários' },
    { nome: 'Ver Relatórios', chave: 'verRelatorios', descricao: 'Acessar relatórios' },
    { nome: 'Gerar Relatórios', chave: 'gerarRelatorios', descricao: 'Exportar relatórios' },
    { nome: 'Ver Logs', chave: 'verLogs', descricao: 'Visualizar logs do sistema' },
    { nome: 'Gerenciar Recursos', chave: 'gerenciarRecursos', descricao: 'Criar, editar e excluir recursos' },
    { nome: 'Gerenciar Perfis', chave: 'gerenciarPerfis', descricao: 'Editar permissões dos perfis' },
    { nome: 'Manutenção Sistema', chave: 'manutencaoSistema', descricao: 'Acessar ferramentas de manutenção' }
  ];
  
  permissoesPorPerfil: PerfilPermissoes[] = [];
  loading = true;
  editando = false;
  perfilEditando: string = '';
  permissoesEditando: { [key: string]: boolean } = {};
  
  userTipo: string = '';

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private refreshService: RefreshService,
    private navCtrl: NavController,
    private permissaoService: PermissaoService,
  ) {
    addIcons({
      peopleOutline,
      shieldOutline,
      createOutline,
      closeOutline,
      refreshOutline,
      checkmarkOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.carregarPermissoes();
  }

  ionViewWillEnter() {
    this.carregarPermissoes();
  }

  async carregarPermissoes() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      this.userTipo = user.tipo || '';
      
      if (this.userTipo !== 'Chefe de TI') {
        this.presentToast('Você não tem permissão para acessar esta página', 'danger');
        this.navCtrl.navigateRoot('/dashboard');
        return;
      }
      
      const permissoes = await this.api.getAll('permissoes');
      
      if (permissoes.length === 0) {
        await this.criarPermissoesPadrao();
      } else {
        this.permissoesPorPerfil = permissoes
          .filter((p: any) => p.perfil !== 'Chefe de TI')
          .map((p: any) => ({
            perfil: p.perfil,
            permissoes: p
          }));
        
        console.log('Permissões carregadas do MariaDB:', this.permissoesPorPerfil);
      }
      
      this.loading = false;
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      this.presentToast('Erro ao carregar permissões', 'danger');
      this.loading = false;
    }
  }

  async criarPermissoesPadrao() {
    const padrao: PerfilPermissoes[] = [
      {
        perfil: 'Professor',
        permissoes: {
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
        }
      },
      {
        perfil: 'Funcionário Administrativo',
        permissoes: {
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
        }
      },
      {
        perfil: 'Coordenador',
        permissoes: {
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
        }
      },
      {
        perfil: 'Diretor',
        permissoes: {
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
        }
      },
      {
        perfil: 'Chefe de TI',
        permissoes: {
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
      }
    ];
    
    for (const item of padrao) {
      await this.api.create('permissoes', { perfil: item.perfil, ...item.permissoes });
      console.log('Permissão padrão criada para:', item.perfil);
    }
    
    this.permissoesPorPerfil = padrao.filter(p => p.perfil !== 'Chefe de TI');
  }

  entrarModoEdicao(perfil: string, permissoes: { [key: string]: boolean }) {
    console.log('Entrando em modo edição para:', perfil);
    console.log('Permissões originais:', permissoes);
    
    this.editando = true;
    this.perfilEditando = perfil;
    
    // Inicializa todas as permissões como false
    const todasPermissoes: { [key: string]: boolean } = {};
    
    for (const p of this.permissoesDisponiveis) {
      todasPermissoes[p.chave] = false;
    }
    
    // Copia as permissões existentes
    for (const [chave, valor] of Object.entries(permissoes)) {
      todasPermissoes[chave] = valor;
    }
    
    this.permissoesEditando = { ...todasPermissoes };
    
    console.log('Permissões copiadas (com todas as chaves):', this.permissoesEditando);
  }

  cancelarEdicao() {
    this.editando = false;
    this.perfilEditando = '';
    this.permissoesEditando = {};
  }

  async salvarPermissoes() {
    console.log('=== SALVANDO PERMISSÕES ===');
    console.log('Perfil:', this.perfilEditando);
    console.log('Permissões a salvar:', this.permissoesEditando);
    
    try {
      await this.api.update('permissoes', this.perfilEditando, this.permissoesEditando);
      
      console.log('✅ Permissões atualizadas');
      
      this.presentToast('Permissões atualizadas com sucesso!', 'success');
      this.cancelarEdicao();
      this.carregarPermissoes();
      this.refreshService.triggerRefresh();
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar permissões:', error);
      this.presentToast('Erro ao salvar permissões: ' + (error.message || 'Erro desconhecido'), 'danger');
    }
  }

  getPermissaoLabel(chave: string): string {
    const permissao = this.permissoesDisponiveis.find(p => p.chave === chave);
    return permissao?.nome || chave;
  }

  getPermissaoDescricao(chave: string): string {
    const permissao = this.permissoesDisponiveis.find(p => p.chave === chave);
    return permissao?.descricao || '';
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