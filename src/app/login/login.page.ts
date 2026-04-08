import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { LogService } from '../services/log.service';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private navCtrl: NavController,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private logService: LogService
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      calendarOutline
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ionViewWillEnter() {
    if (this.authService.isLoggedIn()) {
      console.log('Usuário já logado, redirecionando para dashboard');
      this.navCtrl.navigateRoot('/dashboard', { replaceUrl: true });
      return;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.loginForm.invalid) {
      this.presentAlert('Erro', 'Preencha e-mail e senha corretamente');
      return;
    }

    this.loading = true;

    try {
      const response = await this.authService.login(
        this.loginForm.value.email,
        this.loginForm.value.password
      );

      await this.logService.registrarLog('LOGIN', {
        email: this.loginForm.value.email,
        tipo: response.user.tipo
      });

      console.log('Login realizado:', response.user);

      this.presentAlert('Sucesso', `Bem-vindo, ${response.user.nome}!`);
      await this.navCtrl.navigateRoot('/dashboard', { replaceUrl: true });
      
    } catch (error: any) {
      let mensagem = 'Erro ao fazer login';
      if (error?.error === 'Usuário não encontrado') {
        mensagem = 'Usuário não encontrado';
      } else if (error?.error === 'Senha incorreta') {
        mensagem = 'Senha incorreta';
      }
      this.presentAlert('Erro', mensagem);
    } finally {
      this.loading = false;
    }
  }

  goToForgotPassword() {
    this.navCtrl.navigateForward('/forgot-password');
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}