import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  private checkAuthPromise: Promise<void> | null = null;

  // 🔥 ADICIONADO: controle de inicialização do auth
  private authReadyPromise: Promise<void>;
  private resolveAuthReady!: () => void;

  constructor(
    private api: ApiService,
    private router: Router,
    private injector: Injector
  ) {
    // 🔥 ADICIONADO
    this.authReadyPromise = new Promise((resolve) => {
      this.resolveAuthReady = resolve;
    });

    this.checkAuth();
  }

  // 🔥 ADICIONADO: usado pelos guards
  waitForAuth(): Promise<void> {
    return this.authReadyPromise;
  }

  async checkAuth() {
    if (this.checkAuthPromise) {
      return this.checkAuthPromise;
    }

    this.checkAuthPromise = (async () => {
      if (this.currentUserSubject.value) {
        this.loadingSubject.next(false);
        this.resolveAuthReady(); // 🔥 ADICIONADO
        return;
      }

      try {
        const response = await this.api.getMe();

        if (response && response.user) {
          this.currentUserSubject.next(response.user);
          this.carregarTemaDoUsuario(response.user.id);
        } else {
          this.currentUserSubject.next(null);
        }

      } catch (error) {
        this.currentUserSubject.next(null);
      } finally {
        this.loadingSubject.next(false);
        this.resolveAuthReady(); // 🔥 ADICIONADO (libera guards)
        this.checkAuthPromise = null;
      }
    })();

    return this.checkAuthPromise;
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const response = await this.api.login(email, password);

      if (response && response.user) {
        this.currentUserSubject.next(response.user);
        this.carregarTemaDoUsuario(response.user.id);
        return response;
      }

      throw new Error('Erro ao fazer login');
    } catch (error) {
      throw error;
    }
  }

  private carregarTemaDoUsuario(usuarioId: number) {
    setTimeout(() => {
      const themeService = this.injector.get(ThemeService);
      themeService.carregarTemaDoUsuario(usuarioId);
    }, 0);
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.api.requestPasswordReset(email);
    } catch (error: any) {
      throw error;
    }
  }

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      const response = await this.api.verifyResetToken(token);
      return response.valid;
    } catch (error) {
      return false;
    }
  }

  async confirmPasswordReset(newPassword: string, token: string): Promise<void> {
    try {
      await this.api.confirmPasswordReset(newPassword, token);
    } catch (error: any) {
      throw error;
    }
  }

  async logout() {
    try {
      await this.api.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    }

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getUserRole(): Observable<string | null> {
    return new Observable(observer => {
      const user = this.getCurrentUser();
      observer.next(user?.tipo || null);
      observer.complete();
    });
  }
}