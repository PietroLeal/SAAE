import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkModeSubject.asObservable();
  private usuarioAtualId: number | null = null;

  constructor(private authService: AuthService) {
    this.init();
  }

  private init() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.usuarioAtualId = user.id;
        this.carregarPreferenciaDoUsuario(user.id);
      } else {
        this.usuarioAtualId = null;
        this.carregarPreferenciaLocal();
      }
    });
  }

  private getStorageKey(usuarioId?: number): string {
    if (usuarioId) {
      return `dark_mode_usuario_${usuarioId}`;
    }
    return 'dark_mode_temp';
  }

  private carregarPreferenciaDoUsuario(usuarioId: number) {
    const saved = localStorage.getItem(this.getStorageKey(usuarioId));
    const isDark = saved === 'enabled';
    this.setTheme(isDark);
    this.isDarkModeSubject.next(isDark);
  }

  private carregarPreferenciaLocal() {
    const saved = localStorage.getItem(this.getStorageKey());
    const isDark = saved === 'enabled';
    this.setTheme(isDark);
    this.isDarkModeSubject.next(isDark);
  }

  carregarTemaDoUsuario(usuarioId: number) {
    this.usuarioAtualId = usuarioId;
    const saved = localStorage.getItem(this.getStorageKey(usuarioId));
    const isDark = saved === 'enabled';
    this.setTheme(isDark);
    this.isDarkModeSubject.next(isDark);
  }

  toggleTheme() {
    const newValue = !this.isDarkModeSubject.value;
    this.setTheme(newValue);
    this.isDarkModeSubject.next(newValue);
    
    if (this.usuarioAtualId) {
      localStorage.setItem(this.getStorageKey(this.usuarioAtualId), newValue ? 'enabled' : 'disabled');
    } else {
      localStorage.setItem(this.getStorageKey(), newValue ? 'enabled' : 'disabled');
    }
  }

  private setTheme(isDark: boolean) {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }
}