import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline, 
  calendarOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  loading: boolean = false;
  showPassword: boolean = false;
  isDarkMode: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private themeService: ThemeService
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      calendarOutline,
      moonOutline,
      sunnyOutline
    });
    
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    try {
      const user = await this.authService.login(
        this.loginForm.value.email,
        this.loginForm.value.password
      );
      
      if (user && user.user && user.user.id) {
        this.themeService.carregarTemaDoUsuario(user.user.id);
      }
      
      this.navCtrl.navigateRoot('/dashboard');
    } catch (error: any) {
      const alert = await this.alertCtrl.create({
        header: 'Erro',
        message: error.message || 'Email ou senha inválidos',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.loading = false;
    }
  }

  async goToForgotPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Recuperar Senha',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Seu e-mail'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (data.email) {
              try {
                await this.authService.requestPasswordReset(data.email);
                const successAlert = await this.alertCtrl.create({
                  header: 'Sucesso',
                  message: 'Email de recuperação enviado!',
                  buttons: ['OK']
                });
                await successAlert.present();
              } catch (error) {
                const errorAlert = await this.alertCtrl.create({
                  header: 'Erro',
                  message: 'Erro ao enviar email de recuperação',
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }
}