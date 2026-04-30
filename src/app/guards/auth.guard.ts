import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  // 🔥 ESPERA autenticação terminar
  await authService.waitForAuth();

  if (authService.isLoggedIn()) {
    return true;
  }

  const toast = await toastCtrl.create({
    message: '🔒 Faça login para continuar',
    duration: 3000,
    position: 'bottom',
    color: 'danger'
  });

  await toast.present();

  return router.parseUrl('/login');
};