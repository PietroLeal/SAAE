import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, PopoverController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { personOutline, logOutOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { LogService } from '../services/log.service';
import { RefreshService } from '../services/refresh.service';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ProfileMenuComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';
  userRole: string = '';
  isDarkMode: boolean = false;

  constructor(
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private authService: AuthService,
    private logService: LogService,
    private refreshService: RefreshService
  ) {
    addIcons({
      personOutline,
      logOutOutline,
      moonOutline,
      sunnyOutline
    });
  }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email || '';
      this.userName = user.nome || user.email?.split('@')[0] || 'Usuário';
      this.userRole = user.tipo || '';
    }
    this.isDarkMode = document.body.classList.contains('dark-mode');
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('dark-mode', 'enabled');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('dark-mode', 'disabled');
    }
    this.refreshService.triggerRefresh();
  }

  async verPerfil() {
    await this.popoverCtrl.dismiss();
    this.navCtrl.navigateForward('/perfil');
  }

  async logout() {
    await this.logService.registrarLog('LOGOUT', {});
    await this.popoverCtrl.dismiss();
    await this.authService.logout();
    this.refreshService.triggerRefresh();
    this.navCtrl.navigateRoot('/home');
  }

  fechar() {
    this.popoverCtrl.dismiss();
  }
}