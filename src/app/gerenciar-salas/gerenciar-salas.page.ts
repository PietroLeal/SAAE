import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { SalaService, Sala, TIPOS_AMBIENTE } from '../services/sala.service';
import { LogService } from '../services/log.service';
import { ApiService } from '../services/api.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  createOutline, 
  trashOutline, 
  schoolOutline, 
  flaskOutline, 
  micOutline, 
  videocamOutline, 
  desktopOutline, 
  bookOutline, 
  basketballOutline,
  businessOutline,
  closeCircleOutline
} from 'ionicons/icons';

interface Recurso {
  id?: number;
  nome: string;
  descricao?: string;
}

@Component({
  selector: 'app-gerenciar-salas',
  templateUrl: './gerenciar-salas.page.html',
  styleUrls: ['./gerenciar-salas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class GerenciarSalasPage implements OnInit {
  salas: Sala[] = [];
  loading = true;
  tiposAmbiente = TIPOS_AMBIENTE;
  recursosDisponiveis: Recurso[] = [];
  
  modalOpen = false;
  editando = false;
  salaAtual: Partial<Sala> = {
    nome: '',
    tipoAmbiente: 'sala',
    capacidade: 50,
    recursos: [],
    ativa: true
  };
  recursoSelecionado: string = '';

  constructor(
    private api: ApiService,
    private salaService: SalaService,
    private logService: LogService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      schoolOutline,
      flaskOutline,
      micOutline,
      videocamOutline,
      desktopOutline,
      bookOutline,
      basketballOutline,
      businessOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.carregarSalas();
    this.carregarRecursosDisponiveis();
  }

  ionViewWillEnter() {
    this.carregarSalas();
    this.carregarRecursosDisponiveis();
  }

  async carregarRecursosDisponiveis() {
    try {
      this.recursosDisponiveis = await this.api.getAll('recursos');
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
    }
  }

  getRecursoNome(recId: string): string {
    const recurso = this.recursosDisponiveis.find(r => r.id?.toString() === recId);
    return recurso?.nome || recId;
  }

  adicionarRecurso() {
    if (this.recursoSelecionado && !this.salaAtual.recursos?.includes(this.recursoSelecionado)) {
      this.salaAtual.recursos = [...(this.salaAtual.recursos || []), this.recursoSelecionado];
      this.recursoSelecionado = '';
    }
  }

  removerRecurso(recId: string) {
    this.salaAtual.recursos = this.salaAtual.recursos?.filter(r => r !== recId) || [];
  }

  carregarSalas() {
    this.loading = true;
    this.salaService.getSalas().subscribe({
      next: (salas) => {
        this.salas = salas;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar salas:', err);
        this.loading = false;
      }
    });
  }

  abrirModal(sala?: Sala) {
    if (sala) {
      this.editando = true;
      this.salaAtual = { ...sala };
    } else {
      this.editando = false;
      this.salaAtual = {
        nome: '',
        tipoAmbiente: 'sala',
        capacidade: 50,
        recursos: [],
        ativa: true
      };
    }
    this.modalOpen = true;
  }

  fecharModal() {
    this.modalOpen = false;
    this.editando = false;
    this.salaAtual = {
      nome: '',
      tipoAmbiente: 'sala',
      capacidade: 50,
      recursos: [],
      ativa: true
    };
    this.recursoSelecionado = '';
  }

  getIconePorTipo(tipo: string): string {
    const tipoEncontrado = TIPOS_AMBIENTE.find(t => t.valor === tipo);
    return tipoEncontrado?.icone || 'business-outline';
  }

  async salvarSala() {
    if (!this.salaAtual.nome?.trim()) {
      this.presentToast('Informe o nome da sala', 'warning');
      return;
    }
    if (!this.salaAtual.tipoAmbiente) {
      this.presentToast('Selecione o tipo de ambiente', 'warning');
      return;
    }

    try {
      if (this.editando && this.salaAtual.id) {
        await this.salaService.updateSala(this.salaAtual.id, {
          nome: this.salaAtual.nome,
          tipoAmbiente: this.salaAtual.tipoAmbiente,
          capacidade: this.salaAtual.capacidade,
          recursos: this.salaAtual.recursos,
          descricao: this.salaAtual.descricao,
          ativa: this.salaAtual.ativa
        });
        
        await this.logService.registrarLog('SALA_ATUALIZADA', {
          id: this.salaAtual.id,
          nome: this.salaAtual.nome,
          tipo: this.salaAtual.tipoAmbiente
        });
        
        this.presentToast('Sala atualizada com sucesso!', 'success');
      } else {
        const novaId = await this.salaService.addSala({
          nome: this.salaAtual.nome!,
          tipoAmbiente: this.salaAtual.tipoAmbiente!,
          capacidade: this.salaAtual.capacidade!,
          recursos: this.salaAtual.recursos || [],
          descricao: this.salaAtual.descricao,
          ativa: true
        });
        
        await this.logService.registrarLog('SALA_CRIADA', {
          id: novaId,
          nome: this.salaAtual.nome,
          tipo: this.salaAtual.tipoAmbiente
        });
        
        this.presentToast('Sala criada com sucesso!', 'success');
      }
      this.fecharModal();
      this.carregarSalas();
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      this.presentToast('Erro ao salvar sala', 'danger');
    }
  }

  async confirmarExclusao(sala: Sala) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir a sala "${sala.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirSala(sala)
        }
      ]
    });
    await alert.present();
  }

  async excluirSala(sala: Sala) {
    try {
      await this.salaService.deleteSala(sala.id!);
      
      await this.logService.registrarLog('SALA_EXCLUIDA', {
        id: sala.id,
        nome: sala.nome
      });
      
      this.presentToast('Sala excluída com sucesso!', 'success');
      this.carregarSalas();
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
      this.presentToast('Erro ao excluir sala', 'danger');
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