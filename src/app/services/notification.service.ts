import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async showToast(message: string, color: string = 'danger', duration: number = 3000) {
    try {
      const toast = await this.toastCtrl.create({
        message: message,
        duration: duration,
        position: 'bottom',
        color: color,
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
      console.log('Toast apresentado:', message);
    } catch (error) {
      console.error('Erro ao criar toast:', error);
    }
  }

  async showSuccess(message: string) {
    await this.showToast(message, 'success', 3000);
  }

  async showError(message: string) {
    await this.showToast(message, 'danger', 4000);
  }

  async showWarning(message: string) {
    await this.showToast(message, 'warning', 3000);
  }

  async showInfo(message: string) {
    await this.showToast(message, 'primary', 3000);
  }

  async showAlert(header: string, message: string, buttons: any[] = ['OK']) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: buttons,
      backdropDismiss: false
    });
    await alert.present();
  }
}