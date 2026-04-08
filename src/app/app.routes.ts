import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
    canActivate: [loginGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard]
  },
  {
    path: 'cadastrofuncionario',
    loadComponent: () => import('./cadastrofuncionario/cadastrofuncionario.page').then(m => m.CadastrofuncionarioPage),
    canActivate: []
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil.page').then(m => m.PerfilPage),
    canActivate: [authGuard]
  },
  {
    path: 'gerenciar-salas',
    loadComponent: () => import('./gerenciar-salas/gerenciar-salas.page').then(m => m.GerenciarSalasPage),
    canActivate: [authGuard, roleGuard('gerenciarSalas')]
  },
  {
    path: 'gerenciar-disponibilidade',
    loadComponent: () => import('./gerenciar-disponibilidade/gerenciar-disponibilidade.page').then(m => m.GerenciarDisponibilidadePage),
    canActivate: [authGuard, roleGuard('gerenciarDisponibilidade')]
  },
  {
    path: 'agendamento',
    loadComponent: () => import('./agendamento/agendamento.page').then(m => m.AgendamentoPage),
    canActivate: [authGuard]
  },
  {
    path: 'cancelar-agendamento',
    loadComponent: () => import('./cancelar-agendamento/cancelar-agendamento.page').then(m => m.CancelarAgendamentoPage),
    canActivate: [authGuard]
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./relatorios/relatorios.page').then(m => m.RelatoriosPage),
    canActivate: [authGuard, roleGuard('verRelatorios')]
  },
  {
    path: 'consulta-agendamentos',
    loadComponent: () => import('./consulta-agendamentos/consulta-agendamentos.page').then(m => m.ConsultaAgendamentosPage),
    canActivate: [authGuard, roleGuard('verRelatorios')]
  },
  {
    path: 'visualizacao-detalhada',
    loadComponent: () => import('./visualizacao-detalhada/visualizacao-detalhada.page').then(m => m.VisualizacaoDetalhadaPage),
    canActivate: [authGuard, roleGuard('verRelatorios')]
  },
  {
    path: 'logs',
    loadComponent: () => import('./logs/logs.page').then(m => m.LogsPage),
    canActivate: [authGuard, roleGuard('verLogs')]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/usuarios.page').then(m => m.UsuariosPage),
    canActivate: [authGuard, roleGuard('gerenciarUsuarios')]
  },
  {
    path: 'recursos',
    loadComponent: () => import('./recursos/recursos.page').then(m => m.RecursosPage),
    canActivate: [authGuard, roleGuard('gerenciarRecursos')]
  },
  {
    path: 'perfis',
    loadComponent: () => import('./perfis/perfis.page').then(m => m.PerfisPage),
    canActivate: [authGuard, roleGuard('gerenciarPerfis')]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

];