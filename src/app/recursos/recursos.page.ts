import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  cubeOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  refreshOutline,
  searchOutline,
  checkmarkOutline
} from 'ionicons/icons';

interface Recurso {
  id?: number;
  nome: string;
  descricao?: string;
  createdAt?: Date;
}

@Component({
  selector: 'app-recursos',
  templateUrl: './recursos.page.html',
  styleUrls: ['./recursos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class RecursosPage implements OnInit {
  recursos: Recurso[] = [];
  recursosFiltrados: Recurso[] = [];
  loading = true;
  
  buscaFiltro: string = '';
  
  modalOpen = false;
  editando = false;
  recursoAtual: Partial<Recurso> = {
    nome: '',
    descricao: ''
  };
  
  userTipo: string = '';

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      cubeOutline,
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      refreshOutline,
      searchOutline,
      checkmarkOutline
    });
  }

  ngOnInit() {
    this.carregarRecursos();
  }

  ionViewWillEnter() {
    this.carregarRecursos();
  }

  async carregarRecursos() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      this.userTipo = user.tipo || '';
      
      const recursos = await this.api.getAll('recursos');
      
      this.recursos = recursos;
      
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      this.presentToast('Erro ao carregar recursos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    let filtrados = [...this.recursos];
    
    if (this.buscaFiltro) {
      const busca = this.buscaFiltro.toLowerCase();
      filtrados = filtrados.filter(r => 
        r.nome.toLowerCase().includes(busca) || 
        (r.descricao && r.descricao.toLowerCase().includes(busca))
      );
    }
    
    this.recursosFiltrados = filtrados;
  }

  limparFiltros() {
    this.buscaFiltro = '';
    this.aplicarFiltros();
  }

  refresh() {
    this.carregarRecursos();
  }

  abrirModal(recurso?: Recurso) {
    if (recurso) {
      this.editando = true;
      this.recursoAtual = { ...recurso };
    } else {
      this.editando = false;
      this.recursoAtual = {
        nome: '',
        descricao: ''
      };
    }
    this.modalOpen = true;
  }

  fecharModal() {
    this.modalOpen = false;
    this.editando = false;
    this.recursoAtual = {
      nome: '',
      descricao: ''
    };
  }

  async salvarRecurso() {
    if (!this.recursoAtual.nome?.trim()) {
      this.presentToast('Informe o nome do recurso', 'warning');
      return;
    }

    try {
      if (this.editando && this.recursoAtual.id) {
        await this.api.update('recursos', this.recursoAtual.id, {
          nome: this.recursoAtual.nome,
          descricao: this.recursoAtual.descricao
        });
        this.presentToast('Recurso atualizado com sucesso!', 'success');
      } else {
        await this.api.create('recursos', {
          nome: this.recursoAtual.nome,
          descricao: this.recursoAtual.descricao,
          createdAt: new Date()
        });
        this.presentToast('Recurso criado com sucesso!', 'success');
      }
      this.fecharModal();
      this.carregarRecursos();
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      this.presentToast('Erro ao salvar recurso', 'danger');
    }
  }

  async confirmarExclusao(recurso: Recurso) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o recurso "${recurso.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirRecurso(recurso)
        }
      ]
    });
    await alert.present();
  }

  async excluirRecurso(recurso: Recurso) {
    try {
      await this.api.delete('recursos', recurso.id!);
      this.presentToast('Recurso excluído com sucesso!', 'success');
      this.carregarRecursos();
    } catch (error) {
      console.error('Erro ao excluir recurso:', error);
      this.presentToast('Erro ao excluir recurso', 'danger');
    }
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