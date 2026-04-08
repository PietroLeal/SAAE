import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { PermissaoService, Permissoes } from '../services/permissao.service';
import { AuthService } from '../services/auth.service';

export const roleGuard = (permissaoNecessaria: keyof Permissoes) => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const permissaoService = inject(PermissaoService);
    const toastCtrl = inject(ToastController);

    const user = authService.getCurrentUser();
    if (!user) {
      const toast = await toastCtrl.create({
        message: '🔒 Faça login para continuar',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
      return router.parseUrl('/login');
    }

    const permissoes = await permissaoService.getPermissoesDoUsuario();
    
    if (permissoes && permissoes[permissaoNecessaria]) {
      return true;
    }

    const toast = await toastCtrl.create({
      message: '⛔ Acesso negado. Você não tem permissão para esta área.',
      duration: 3000,
      position: 'bottom',
      color: 'warning'
    });
    await toast.present();
    
    return router.parseUrl('/dashboard');
  };
};