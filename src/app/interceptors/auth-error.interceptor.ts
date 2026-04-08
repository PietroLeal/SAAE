import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  constructor(private notification: NotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error) => {
        if (error.status === 403 || error?.error?.code === 'permission-denied') {
          this.notification.showToast('Você não tem permissão para esta ação.', 'warning', 3000);
        } else if (error.status === 401 || error?.error?.code === 'unauthenticated') {
          this.notification.showToast('Você precisa estar logado para esta ação.', 'danger', 3000);
        }
        
        return throwError(() => error);
      })
    );
  }
}