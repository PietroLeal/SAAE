import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { NotificacoesComponent } from '../notificacoes/notificacoes.component';
import { NotificationService } from '../services/notificacao.service';
import { addIcons } from 'ionicons';
import { notificationsOutline, personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-title class="logo-title" (click)="goToDashboard()">SAAE</ion-title>
        </ion-buttons>
        <ion-title class="title-center">Sistema de Agendamento Escolar</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="abrirNotificacoes()">
            <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
            <ion-badge *ngIf="notificacoesNaoLidas > 0" color="danger" class ="notificacao-badge">
              {{ notificacoesNaoLidas > 99 ? '99+' : notificacoesNaoLidas }}
            </ion-badge>
          </ion-button>
          <ion-button (click)="openUserProfile($event)">
            <ion-icon slot="icon-only" name="person-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .logo-title {
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      margin: 0;
    }

    .title-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      font-size: 1rem;
      font-weight: 500;
    }

    .notificacao-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 10px;
      padding: 4px 6px;
      border-radius: 50%;
    }

    @media (max-width: 768px) {
      .title-center {
        display: none;
      }
    }
  `]
})
export class AppHeaderComponent implements OnInit {
  notificacoesNaoLidas = 0;

  constructor(
    private router: Router,
    private popoverCtrl: PopoverController,
    private modalController: ModalController,
    private notificationService: NotificationService
  ) {
    addIcons({
      notificationsOutline,
      personCircleOutline
    });
  }

  ngOnInit() {
    this.notificationService.notificacoes$.subscribe(() => {
      this.notificacoesNaoLidas = this.notificationService.getNaoLidasCount();
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  async abrirNotificacoes() {
    const modal = await this.modalController.create({
      component: NotificacoesComponent,
      componentProps: {},
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.5, 0.8]
    });
    await modal.present();
  }

  async openUserProfile(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: ProfileMenuComponent,
      event: event,
      mode: 'ios',
      cssClass: 'profile-popover',
      backdropDismiss: true,
      showBackdrop: true,
      translucent: false,
      alignment: 'end'
    });
    await popover.present();
  }
}