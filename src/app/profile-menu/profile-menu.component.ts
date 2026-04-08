import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, PopoverController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { personOutline, logOutOutline } from 'ionicons/icons';
import { LogService } from '../services/log.service';

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

  constructor(
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private authService: AuthService,
    private logService: LogService
  ) {
    addIcons({
      personOutline,
      logOutOutline
    });
  }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email || '';
      this.userName = user.nome || user.email?.split('@')[0] || 'Usuário';
      this.userRole = user.tipo || '';
    }
  }

  async verPerfil() {
    await this.popoverCtrl.dismiss();
    this.navCtrl.navigateForward('/perfil');
  }

  async logout() {
    await this.logService.registrarLog('LOGOUT', {});
    await this.popoverCtrl.dismiss();
    await this.authService.logout();
    this.navCtrl.navigateRoot('/home');
  }

  fechar() {
    this.popoverCtrl.dismiss();
  }
}