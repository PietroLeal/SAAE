import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  lockClosedOutline, 
  alertCircleOutline, 
  checkmarkCircleOutline, 
  eyeOutline, 
  eyeOffOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ResetPasswordPage implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  tokenValid = false;
  resetSuccess = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private navCtrl: NavController
  ) {
    addIcons({
      lockClosedOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  async ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.tokenValid = false;
      return;
    }

    this.loading = true;
    this.tokenValid = await this.authService.verifyResetToken(this.token);
    this.loading = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async resetPassword() {
    this.errorMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      return;
    }

    this.loading = true;

    try {
      await this.authService.confirmPasswordReset(this.newPassword, this.token);
      this.resetSuccess = true;
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Erro ao redefinir senha. Tente novamente.';
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.navCtrl.navigateRoot('/login');
  }

  goToForgotPassword() {
    this.navCtrl.navigateBack('/forgot-password');
  }
}