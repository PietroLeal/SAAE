import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  mailOutline, 
  callOutline, 
  briefcaseOutline, 
  createOutline,
  saveOutline,
  closeOutline
} from 'ionicons/icons';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule,
    AppHeaderComponent
  ]
})
export class PerfilPage implements OnInit {
  usuario: any = {
    nome: '',
    email: '',
    telefone: '',
    tipo: '',
    criadoEm: ''
  };
  
  editando = false;
  loading = true;
  salvando = false;

  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
    private api: ApiService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      personOutline,
      mailOutline,
      callOutline,
      briefcaseOutline,
      createOutline,
      saveOutline,
      closeOutline
    });
  }

  async ngOnInit() {
    await this.carregarPerfil();
  }

  async carregarPerfil() {
    this.loading = true;
    
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.navCtrl.navigateRoot('/login');
      return;
    }

    try {
      const funcionario = await this.api.getById('funcionarios', user.id);
      
      if (funcionario) {
        this.usuario = {
          nome: funcionario.nome || '',
          email: user.email || '',
          telefone: funcionario.telefone || '',
          tipo: funcionario.tipo || '',
          criadoEm: funcionario.createdAt ? new Date(funcionario.createdAt).toLocaleDateString('pt-BR') : ''
        };
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      this.presentAlert('Erro', 'Não foi possível carregar seus dados');
    } finally {
      this.loading = false;
    }
  }

  entrarModoEdicao() {
    this.editando = true;
  }

  cancelarEdicao() {
    this.editando = false;
    this.carregarPerfil();
  }

  async salvarPerfil() {
    if (!this.usuario.nome || this.usuario.nome.trim() === '') {
      this.presentAlert('Erro', 'Nome não pode ficar vazio');
      return;
    }

    this.salvando = true;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      await this.api.update('funcionarios', user.id, {
        nome: this.usuario.nome,
        telefone: this.usuario.telefone
      });

      this.editando = false;
      this.presentAlert('Sucesso', 'Perfil atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      this.presentAlert('Erro', 'Não foi possível salvar as alterações');
    } finally {
      this.salvando = false;
    }
  }

  voltar() {
    this.navCtrl.back();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
  
  ionViewWillEnter() {
    this.carregarPerfil();
  }
}