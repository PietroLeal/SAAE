import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  // Aguarda o loading terminar
  const loading = await firstValueFrom(authService.loading$);
  if (loading) {
    // Se ainda está carregando, espera
    await firstValueFrom(authService.loading$.pipe(
      // Filtra até loading ser false
    ));
  }

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