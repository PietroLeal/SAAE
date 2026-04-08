import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  peopleOutline,
  personOutline,
  briefcaseOutline,
  mailOutline,
  callOutline,
  createOutline,
  closeOutline,
  refreshOutline,
  searchOutline,
  checkmarkOutline,
  calendarOutline,
  trashOutline
} from 'ionicons/icons';
import { NavController } from '@ionic/angular';

interface Funcionario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  tipo: string;
  createdAt: Date;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class UsuariosPage implements OnInit {
  funcionarios: Funcionario[] = [];
  funcionariosFiltrados: Funcionario[] = [];
  loading = true;
  
  buscaFiltro: string = '';
  tipoFiltro: string = '';
  
  tipos = [
    'Professor',
    'Coordenador',
    'Diretor',
    'Chefe de TI',
    'Funcionário Administrativo'
  ];
  
  modalOpen = false;
  editando = false;
  funcionarioAtual: Partial<Funcionario> = {};
  
  userTipo: string = '';

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({
      peopleOutline,
      personOutline,
      briefcaseOutline,
      mailOutline,
      callOutline,
      createOutline,
      closeOutline,
      refreshOutline,
      searchOutline,
      checkmarkOutline,
      calendarOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.carregarFuncionarios();
  }

  ionViewWillEnter() {
    this.carregarFuncionarios();
  }

  async carregarFuncionarios() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      this.userTipo = user.tipo || '';
      
      const funcionarios = await this.api.getAll('funcionarios');
      
      this.funcionarios = funcionarios.map((f: any) => ({
        id: f.id,
        nome: f.nome,
        email: f.email,
        telefone: f.telefone,
        tipo: f.tipo,
        createdAt: f.createdAt ? new Date(f.createdAt) : new Date()
      }));
      
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      this.presentToast('Erro ao carregar funcionários', 'danger');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    let filtrados = [...this.funcionarios];
    
    if (this.buscaFiltro) {
      const busca = this.buscaFiltro.toLowerCase();
      filtrados = filtrados.filter(f => 
        f.nome.toLowerCase().includes(busca) || 
        f.email.toLowerCase().includes(busca)
      );
    }
    
    if (this.tipoFiltro) {
      filtrados = filtrados.filter(f => f.tipo === this.tipoFiltro);
    }
    
    this.funcionariosFiltrados = filtrados;
  }

  limparFiltros() {
    this.buscaFiltro = '';
    this.tipoFiltro = '';
    this.aplicarFiltros();
  }

  refresh() {
    this.carregarFuncionarios();
  }

  abrirModal(funcionario?: Funcionario) {
    if (funcionario) {
      this.editando = true;
      this.funcionarioAtual = { ...funcionario };
    } else {
      this.editando = false;
      this.funcionarioAtual = {
        nome: '',
        email: '',
        telefone: '',
        tipo: 'Professor'
      };
    }
    this.modalOpen = true;
  }

  fecharModal() {
    this.modalOpen = false;
    this.editando = false;
    this.funcionarioAtual = {};
  }

  async salvarFuncionario() {
    if (!this.funcionarioAtual.nome?.trim()) {
      this.presentToast('Informe o nome do funcionário', 'warning');
      return;
    }
    if (!this.funcionarioAtual.tipo) {
      this.presentToast('Selecione o tipo do funcionário', 'warning');
      return;
    }

    try {
      await this.api.update('funcionarios', this.funcionarioAtual.id!, {
        nome: this.funcionarioAtual.nome,
        telefone: this.funcionarioAtual.telefone,
        tipo: this.funcionarioAtual.tipo
      });
      
      this.presentToast('Funcionário atualizado com sucesso!', 'success');
      this.fecharModal();
      this.carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      this.presentToast('Erro ao salvar funcionário', 'danger');
    }
  }

  async confirmarExclusao(funcionario: Funcionario) {
    const user = this.authService.getCurrentUser();
    if (user && user.id === funcionario.id) {
      this.presentToast('Você não pode excluir sua própria conta', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o usuário "${funcionario.nome}"?\n\nEsta ação não pode ser desfeita.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirUsuario(funcionario)
        }
      ]
    });
    await alert.present();
  }

  async excluirUsuario(funcionario: Funcionario) {
    try {
      await this.api.delete('funcionarios', funcionario.id);
      
      const reservas = await this.api.getWithQuery('reservas', { usuarioId: funcionario.id });
      for (const reserva of reservas) {
        await this.api.delete('reservas', reserva.id);
      }
      
      this.presentToast('Usuário excluído com sucesso!', 'success');
      this.carregarFuncionarios();
      
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      this.presentToast('Erro ao excluir usuário', 'danger');
    }
  }

  getTipoColor(tipo: string): string {
    switch(tipo) {
      case 'Diretor': return 'danger';
      case 'Chefe de TI': return 'warning';
      case 'Coordenador': return 'primary';
      case 'Funcionário Administrativo': return 'secondary';
      default: return 'medium';
    }
  }

  formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR');
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
  
  irParaCadastro() {
    this.navCtrl.navigateForward('/cadastrofuncionario');
  }
}