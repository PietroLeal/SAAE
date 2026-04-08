import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, callOutline, briefcaseOutline, lockClosedOutline, eyeOutline, eyeOffOutline, shieldCheckmarkOutline, personAddOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-cadastrofuncionario',
  templateUrl: './cadastrofuncionario.page.html',
  styleUrls: ['./cadastrofuncionario.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AppHeaderComponent
  ]
})
export class CadastrofuncionarioPage implements AfterViewInit {

  registerForm: FormGroup;
  loading: boolean = false;
  showPassword: boolean = false;
  tipos: string[] = ['Professor', 'Coordenador', 'Diretor', 'Chefe de TI', 'Funcionário Administrativo'];

  constructor(
    public navCtrl: NavController,
    public formbuilder: FormBuilder,
    public alertCtrl: AlertController,
    private api: ApiService
  ) {
    addIcons({
      personOutline,
      mailOutline,
      callOutline,
      briefcaseOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      shieldCheckmarkOutline,
      personAddOutline
    });
    
    this.registerForm = this.formbuilder.group({
      name: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.registerForm.get('tipo')?.updateValueAndValidity();
      this.registerForm.updateValueAndValidity();
    }, 100);
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors?.['required']) return 'Este campo é obrigatório';
    if (control.errors?.['minlength']) return `Mínimo de ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors?.['email']) return 'E-mail inválido';
    
    return '';
  }

  async submitForm() {
    this.registerForm.markAllAsTouched();
    
    if (this.registerForm.valid) {
      this.loading = true;
      
      try {
        await this.api.create('funcionarios', {
          nome: this.registerForm.value.name,
          email: this.registerForm.value.email,
          telefone: this.registerForm.value.telefone,
          tipo: this.registerForm.value.tipo,
          password: this.registerForm.value.password,
          createdAt: new Date()
        });
        
        this.presentAlert('Sucesso', `Funcionário ${this.registerForm.value.name} cadastrado com sucesso!`);
        this.loading = false;
        this.navCtrl.navigateRoot('/login');
        
      } catch (error: any) {
        this.loading = false;
        if (error?.error?.code === 'ER_DUP_ENTRY') {
          this.presentAlert('Erro', 'E-mail já cadastrado!');
        } else {
          this.presentAlert('Erro', error.message || 'Erro ao cadastrar funcionário');
        }
      }
    } else {
      this.presentAlert('Erro', 'Preencha todos os campos corretamente');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}