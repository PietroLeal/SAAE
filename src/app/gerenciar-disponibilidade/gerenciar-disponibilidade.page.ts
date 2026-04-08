import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { DisponibilidadeService, DIAS_SEMANA, HORARIOS, Disponibilidade } from '../services/disponibilidade.service';
import { SalaService, Sala } from '../services/sala.service';
import { LogService } from '../services/log.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  createOutline, 
  trashOutline, 
  timeOutline,
  closeCircleOutline,
  calendarOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-gerenciar-disponibilidade',
  templateUrl: './gerenciar-disponibilidade.page.html',
  styleUrls: ['./gerenciar-disponibilidade.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class GerenciarDisponibilidadePage implements OnInit {
  salas: Sala[] = [];
  salaSelecionada: number | null = null;
  todasDisponibilidades: Disponibilidade[] = [];
  disponibilidades: Disponibilidade[] = [];
  loading = true;
  diasSemana = DIAS_SEMANA;
  horarios = HORARIOS;
  
  modalOpen = false;
  editando = false;
  modoConfiguracao: 'unico' | 'todos' = 'unico';
  
  disponibilidadeAtual: any = {
    salaId: null,
    nomeSala: '',
    horarios: [] as number[],
    ativo: true
  };

  constructor(
    private salaService: SalaService,
    private disponibilidadeService: DisponibilidadeService,
    private logService: LogService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      timeOutline,
      closeCircleOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    this.carregarTudo();
  }

  ionViewWillEnter() {
    if (this.salaSelecionada) {
      this.carregarTudo();
    }
  }

  carregarTudo() {
    this.loading = true;
    
    this.salaService.getSalas().subscribe({
      next: (salas) => {
        this.salas = salas.filter(s => s.ativa);
        this.carregarTodasDisponibilidades();
      },
      error: (err) => {
        console.error('Erro ao carregar salas:', err);
        this.loading = false;
      }
    });
  }

  carregarTodasDisponibilidades() {
    this.disponibilidadeService.getTodasDisponibilidades().subscribe({
      next: (disponibilidades) => {
        this.todasDisponibilidades = disponibilidades;
        
        if (this.salaSelecionada) {
          this.filtrarDisponibilidadesPorSala();
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar disponibilidades:', err);
        this.loading = false;
      }
    });
  }

  onSalaSelecionada() {
    if (this.salaSelecionada) {
      this.filtrarDisponibilidadesPorSala();
    } else {
      this.disponibilidades = [];
    }
  }

  filtrarDisponibilidadesPorSala() {
    this.disponibilidades = this.todasDisponibilidades.filter(
      disp => disp.salaId === this.salaSelecionada
    );
  }

  abrirModal(disponibilidade?: any) {
    const sala = this.salas.find(s => s.id === this.salaSelecionada);
    this.modoConfiguracao = 'unico';
    
    if (disponibilidade) {
      this.editando = true;
      this.disponibilidadeAtual = { ...disponibilidade };
    } else {
      this.editando = false;
      this.disponibilidadeAtual = {
        salaId: this.salaSelecionada,
        nomeSala: sala?.nome || '',
        diaSemana: 1,
        horarios: [],
        ativo: true
      };
    }
    this.modalOpen = true;
  }

  async abrirModalParaTodosDias() {
    const disponibilidadesExistentes = this.disponibilidades.length;
    
    if (disponibilidadesExistentes > 0) {
      const alert = await this.alertCtrl.create({
        header: 'Atenção!',
        message: `Esta sala já possui ${disponibilidadesExistentes} configurações de horário. Deseja sobrescrever todos os dias com a nova configuração?`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Sobrescrever',
            handler: () => this.prosseguirAbrirModalTodosDias()
          }
        ]
      });
      await alert.present();
    } else {
      this.prosseguirAbrirModalTodosDias();
    }
  }

  prosseguirAbrirModalTodosDias() {
    const sala = this.salas.find(s => s.id === this.salaSelecionada);
    this.modoConfiguracao = 'todos';
    this.editando = false;
    this.disponibilidadeAtual = {
      salaId: this.salaSelecionada,
      nomeSala: sala?.nome || '',
      horarios: [],
      ativo: true
    };
    this.modalOpen = true;
  }

  fecharModal() {
    this.modalOpen = false;
    this.editando = false;
  }

  toggleHorario(horarioNumero: number) {
    const index = this.disponibilidadeAtual.horarios.indexOf(horarioNumero);
    if (index > -1) {
      this.disponibilidadeAtual.horarios.splice(index, 1);
    } else {
      this.disponibilidadeAtual.horarios.push(horarioNumero);
    }
  }

  selecionarTodosHorarios() {
    this.disponibilidadeAtual.horarios = this.horarios.map(h => h.numero);
  }

  limparTodosHorarios() {
    this.disponibilidadeAtual.horarios = [];
  }

  async salvarDisponibilidade() {
    if (this.disponibilidadeAtual.horarios.length === 0) {
      this.presentToast('Selecione pelo menos um horário', 'warning');
      return;
    }

    try {
      if (this.modoConfiguracao === 'todos') {
        await this.disponibilidadeService.addDisponibilidadeParaTodosOsDias({
          salaId: this.disponibilidadeAtual.salaId,
          nomeSala: this.disponibilidadeAtual.nomeSala,
          horarios: this.disponibilidadeAtual.horarios,
          ativo: true
        });
        
        await this.logService.registrarLog('DISPONIBILIDADE_ATUALIZADA', {
          salaId: this.disponibilidadeAtual.salaId,
          salaNome: this.disponibilidadeAtual.nomeSala,
          horarios: this.disponibilidadeAtual.horarios
        });
        
        this.presentToast('Disponibilidade configurada para todos os dias da semana!', 'success');
      } else if (this.editando && this.disponibilidadeAtual.id) {
        await this.disponibilidadeService.updateDisponibilidade(this.disponibilidadeAtual.id, {
          horarios: this.disponibilidadeAtual.horarios,
          ativo: this.disponibilidadeAtual.ativo
        });
        
        await this.logService.registrarLog('DISPONIBILIDADE_ATUALIZADA', {
          id: this.disponibilidadeAtual.id,
          dia: this.disponibilidadeAtual.diaNome,
          horarios: this.disponibilidadeAtual.horarios
        });
        
        this.presentToast('Disponibilidade atualizada com sucesso!', 'success');
      } else {
        const dia = this.diasSemana.find(d => d.valor === this.disponibilidadeAtual.diaSemana);
        await this.disponibilidadeService.addDisponibilidade({
          salaId: this.disponibilidadeAtual.salaId,
          nomeSala: this.disponibilidadeAtual.nomeSala,
          diaSemana: this.disponibilidadeAtual.diaSemana || 1,
          diaNome: dia?.nome || 'Segunda-feira',
          horarios: this.disponibilidadeAtual.horarios,
          ativo: true
        });
        
        await this.logService.registrarLog('DISPONIBILIDADE_CRIADA', {
          salaId: this.disponibilidadeAtual.salaId,
          salaNome: this.disponibilidadeAtual.nomeSala,
          dia: dia?.nome,
          horarios: this.disponibilidadeAtual.horarios
        });
        
        this.presentToast('Disponibilidade criada com sucesso!', 'success');
      }
      
      this.fecharModal();
      this.carregarTudo();
    } catch (error) {
      console.error('Erro ao salvar disponibilidade:', error);
      this.presentToast('Erro ao salvar disponibilidade', 'danger');
    }
  }

  async confirmarExclusao(disponibilidade: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir a disponibilidade de ${disponibilidade.diaNome} (${this.getHorariosTexto(disponibilidade.horarios)})?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirDisponibilidade(disponibilidade)
        }
      ]
    });
    await alert.present();
  }

  async excluirDisponibilidade(disponibilidade: any) {
    try {
      await this.disponibilidadeService.deleteDisponibilidade(disponibilidade.id);
      
      await this.logService.registrarLog('DISPONIBILIDADE_EXCLUIDA', {
        id: disponibilidade.id,
        salaId: disponibilidade.salaId,
        dia: disponibilidade.diaNome
      });
      
      this.presentToast('Disponibilidade excluída com sucesso!', 'success');
      this.carregarTudo();
    } catch (error) {
      console.error('Erro ao excluir disponibilidade:', error);
      this.presentToast('Erro ao excluir disponibilidade', 'danger');
    }
  }

  getHorariosTexto(horarios: number[]): string {
    if (!horarios || horarios.length === 0) return 'Nenhum horário';
    const horariosOrdenados = [...horarios].sort((a, b) => a - b);
    return horariosOrdenados.map(h => {
      const horario = this.horarios.find(hh => hh.numero === h);
      return horario ? `${horario.numero}º` : '';
    }).join(', ');
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