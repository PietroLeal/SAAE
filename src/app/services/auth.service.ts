import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();
  private checkAuthPromise: Promise<void> | null = null;

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    this.checkAuth();
  }

  async checkAuth() {
    if (this.checkAuthPromise) {
      return this.checkAuthPromise;
    }

    this.checkAuthPromise = (async () => {
      if (this.currentUserSubject.value) {
        this.loadingSubject.next(false);
        return;
      }

      try {
        const response = await this.api.getMe();
        if (response && response.user) {
          this.currentUserSubject.next(response.user);
        }
      } catch (error) {
        this.currentUserSubject.next(null);
      } finally {
        this.loadingSubject.next(false);
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
        return response;
      }
      throw new Error('Erro ao fazer login');
    } catch (error) {
      throw error;
    }
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