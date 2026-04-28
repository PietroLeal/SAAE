  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { IonicModule, ModalController } from '@ionic/angular';
  import { NotificationService, Notificacao } from 'src/app/services/notificacao.service';

  @Component({
    selector: 'app-notificacoes',
    templateUrl: './notificacoes.component.html',
    styleUrls: ['./notificacoes.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
  })
  export class NotificacoesComponent implements OnInit {
    notificacoes: Notificacao[] = [];

    constructor(
      private notificationService: NotificationService,
      private modalController: ModalController
    ) {}

    ngOnInit() {
      this.notificationService.notificacoes$.subscribe(notificacoes => {
        this.notificacoes = notificacoes;
      });
    }

    fechar() {
      this.modalController.dismiss();
    }

    marcarTodasComoLidas() {
      this.notificationService.marcarTodasComoLidas();
    }

    removerNotificacao(id: number) {
      this.notificationService.removerNotificacao(id);
    }

    limparTodas() {
      this.notificationService.limparTodas();
    }

    temNotificacoesNaoLidas(): boolean {
      return this.notificacoes.some(n => !n.lida);
    }

    abrirNotificacao(notif: Notificacao) {
      if (!notif.lida) {
        this.notificationService.marcarComoLida(notif.id);
      }
      
      if (notif.tipo === 'reserva') {
        this.modalController.dismiss();
        window.location.href = '/cancelar-agendamento';
      }
    }
  }