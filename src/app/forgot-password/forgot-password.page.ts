import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { mailOutline, checkmarkCircleOutline, alertCircleOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ForgotPasswordPage {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private navCtrl: NavController
  ) {
    addIcons({
      mailOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      arrowBackOutline
    });
  }

  async requestReset() {
    if (!this.email) {
      this.errorMessage = 'Informe seu e-mail';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Informe um e-mail válido';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      await this.authService.requestPasswordReset(this.email);
      this.successMessage = 'Enviamos um link de redefinição para seu e-mail. Verifique sua caixa de entrada e spam.';
      this.email = '';
    } catch (error: any) {
      this.successMessage = 'Se o e-mail estiver cadastrado, você receberá um link de redefinição em breve.';
      this.email = '';
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }
}