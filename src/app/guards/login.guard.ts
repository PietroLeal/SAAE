import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const loginGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Aguarda o loading terminar
  const loading = await firstValueFrom(authService.loading$);
  
  if (authService.isLoggedIn()) {
    return router.parseUrl('/dashboard');
  }

  return true;
};