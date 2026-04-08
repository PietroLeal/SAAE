import { Injectable } from '@angular/core';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor() {
    axios.defaults.withCredentials = true;
  }

  private async request(method: string, url: string, data?: any) {
    try {
      const response = await axios({ 
        method, 
        url: `${API_URL}${url}`, 
        data, 
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw error;
      }
      throw error.response?.data || error;
    }
  }

  // ========== REDEFINIÇÃO DE SENHA ==========
  
  async requestPasswordReset(email: string): Promise<any> {
    try {
      return await this.post('/auth/request-reset-password', { email });
    } catch (error) {
      throw error;
    }
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean }> {
    try {
      return await this.post('/auth/verify-reset-token', { token });
    } catch (error) {
      return { valid: false };
    }
  }

  async confirmPasswordReset(password: string, token: string): Promise<any> {
    try {
      return await this.post('/auth/confirm-reset-password', { password, token });
    } catch (error) {
      throw error;
    }
  }

  // ========== MÉTODOS EXISTENTES ==========

  get(url: string) { return this.request('GET', url); }
  post(url: string, data: any) { return this.request('POST', url, data); }
  put(url: string, data: any) { return this.request('PUT', url, data); }

  login(email: string, password: string) { 
    return this.post('/auth/login', { email, password }); 
  }
  
  logout() { 
    return this.post('/auth/logout', {}); 
  }
  
  getMe() { 
    return this.get('/auth/me'); 
  }

  getAll(table: string) { return this.get(`/${table}`); }
  getById(table: string, id: string | number) { return this.get(`/${table}/${id}`); }
  getWithQuery(table: string, params: any) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/${table}/query?${queryParams}`);
  }
  create(table: string, data: any) { return this.post(`/${table}`, data); }
  update(table: string, id: string | number, data: any) { return this.put(`/${table}/${id}`, data); }
  delete(table: string, id: string | number) { return this.request('DELETE', `/${table}/${id}`); }

  createDisponibilidadeTodosDias(data: any) { return this.post('/disponibilidades/todos-dias', data); }
}