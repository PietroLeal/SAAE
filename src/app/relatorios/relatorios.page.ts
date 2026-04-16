import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { addIcons } from 'ionicons';
import { 
  barChartOutline,
  calendarOutline,
  timeOutline,
  businessOutline,
  downloadOutline,
  filterOutline,
  closeOutline,
  personOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  printOutline,
  documentOutline
} from 'ionicons/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  VerticalAlign,
  Header,   // <--- ADICIONADO
  Footer    // <--- ADICIONADO
} from 'docx';

interface ReservaRelatorio {
  id: number;
  salaNome: string;
  usuarioNome: string;
  data: string;
  horario: number;
  status: string;
  motivo?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class RelatoriosPage implements OnInit {
  reservas: ReservaRelatorio[] = [];
  reservasFiltradas: ReservaRelatorio[] = [];
  loading = true;
  
  dataInicio: string = '';
  dataFim: string = '';
  salaFiltro: string = '';
  statusFiltro: string = 'todos';
  salas: string[] = [];
  
  totalReservas = 0;
  reservasConfirmadas = 0;
  reservasCanceladas = 0;
  
  horarios = [
    '1º Horário (07:00 - 07:50)',
    '2º Horário (07:50 - 08:40)',
    '3º Horário (08:50 - 09:40)',
    '4º Horário (09:40 - 10:30)',
    '5º Horário (10:30 - 11:20)',
    '6º Horário (11:20 - 12:10)',
    '7º Horário (12:30 - 13:20)',
    '8º Horário (13:20 - 14:10)',
    '9º Horário (14:10 - 15:00)',
    '10º Horário (15:10 - 16:00)',
    '11º Horário (16:00 - 16:50)',
    '12º Horário (16:50 - 17:40)'
  ];

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      barChartOutline,
      calendarOutline,
      timeOutline,
      businessOutline,
      downloadOutline,
      filterOutline,
      closeOutline,
      personOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      printOutline,
      documentOutline
    });
  }

  ngOnInit() {
    this.carregarRelatorios();
  }

  ionViewWillEnter() {
    this.carregarRelatorios();
  }

  async carregarRelatorios() {
    this.loading = true;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      
      let params: any = { orderBy: 'data', order: 'DESC' };
      
      if (user.tipo !== 'Diretor' && user.tipo !== 'Chefe de TI' && user.tipo !== 'Coordenador') {
        params.usuarioId = user.id;
      }
      
      const reservas = await this.api.getWithQuery('reservas', params);
      
      this.reservas = reservas.map((r: any) => ({
        id: r.id,
        salaNome: r.salaNome,
        usuarioNome: r.usuarioNome,
        data: r.data,
        horario: r.horario,
        status: r.status,
        motivo: r.motivo,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
      }));
      
      this.salas = [...new Set(this.reservas.map(r => r.salaNome))].sort();
      
      this.calcularEstatisticas();
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      this.presentToast('Erro ao carregar relatórios', 'danger');
    } finally {
      this.loading = false;
    }
  }

  calcularEstatisticas() {
    this.totalReservas = this.reservas.length;
    this.reservasConfirmadas = this.reservas.filter(r => r.status === 'confirmada').length;
    this.reservasCanceladas = this.reservas.filter(r => r.status === 'cancelada').length;
  }

  aplicarFiltros() {
    let filtradas = [...this.reservas];
    
    if (this.dataInicio) {
      filtradas = filtradas.filter(r => r.data >= this.dataInicio);
    }
    if (this.dataFim) {
      filtradas = filtradas.filter(r => r.data <= this.dataFim);
    }
    if (this.salaFiltro) {
      filtradas = filtradas.filter(r => r.salaNome === this.salaFiltro);
    }
    if (this.statusFiltro !== 'todos') {
      filtradas = filtradas.filter(r => r.status === this.statusFiltro);
    }
    
    this.reservasFiltradas = filtradas;
  }

  limparFiltros() {
    this.dataInicio = '';
    this.dataFim = '';
    this.salaFiltro = '';
    this.statusFiltro = 'todos';
    this.aplicarFiltros();
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  getHorarioLabel(horario: number): string {
    return this.horarios[horario - 1] || `${horario}º Horário`;
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'danger';
      default: return 'warning';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'confirmada': return 'Confirmada';
      case 'cancelada': return 'Cancelada';
      default: return 'Pendente';
    }
  }

  exportarCSV() {
    if (this.reservasFiltradas.length === 0) {
      this.presentToast('Não há dados para exportar', 'warning');
      return;
    }

    const confirmadas = this.reservasFiltradas.filter(r => r.status === 'confirmada');
    const canceladas = this.reservasFiltradas.filter(r => r.status === 'cancelada');
    
    let csv = '\uFEFF';
    
    csv += `"="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="\n`;
    csv += `"                 SISTEMA DE AGENDAMENTO DE AMBIENTES ESCOLARES"\n`;
    csv += `"="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="="\n\n`;
    csv += `"RELATÓRIO DE AGENDAMENTOS"\n`;
    csv += `"${"=".repeat(50)}"\n\n`;
    csv += `"Gerado em: ${new Date().toLocaleString('pt-BR')}"\n`;
    csv += `"Período: ${this.dataInicio || 'Todas'} até ${this.dataFim || 'Todas'}"\n`;
    csv += `"Sala: ${this.salaFiltro || 'Todas'}"\n`;
    csv += `"Status: ${this.statusFiltro === 'todos' ? 'Todos' : this.getStatusLabel(this.statusFiltro)}"\n\n`;
    
    csv += `"ESTATÍSTICAS"\n`;
    csv += `"${"-".repeat(40)}"\n`;
    csv += `"Total de reservas: ${this.reservasFiltradas.length}"\n`;
    csv += `"Confirmadas: ${confirmadas.length}"\n`;
    csv += `"Canceladas: ${canceladas.length}"\n\n`;
    
    csv += `"LISTA DE RESERVAS"\n`;
    csv += `"${"-".repeat(40)}"\n\n`;
    
    csv += `"Sala";"Usuário";"Data";"Horário";"Status";"Motivo"\n`;
    csv += `"${"-".repeat(80)}"\n`;
    
    for (const r of this.reservasFiltradas) {
      const linha = [
        `"${r.salaNome.replace(/"/g, '""')}"`,
        `"${r.usuarioNome.replace(/"/g, '""')}"`,
        `"${this.formatarData(r.data)}"`,
        `"${this.getHorarioLabel(r.horario)}"`,
        `"${this.getStatusLabel(r.status)}"`,
        `"${(r.motivo || '').replace(/"/g, '""')}"`
      ].join(';');
      csv += linha + '\n';
    }
    
    csv += `\n\n`;
    csv += `"${"=".repeat(80)}"\n`;
    csv += `"Relatório gerado automaticamente pelo Sistema de Agendamento de Ambientes Escolares"\n`;
    csv += `"${"=".repeat(80)}"\n`;
    
    this.baixarArquivo(csv, `relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  }

  async exportarDOCX() {
    if (this.reservasFiltradas.length === 0) {
      this.presentToast('Não há dados para exportar', 'warning');
      return;
    }

    const confirmadas = this.reservasFiltradas.filter(r => r.status === 'confirmada');
    const canceladas = this.reservasFiltradas.filter(r => r.status === 'cancelada');

    const children: any[] = [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "RELATÓRIO DE AGENDAMENTOS",
            bold: true,
            size: 28,
            color: "333333"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Gerado em: ", bold: true }),
          new TextRun(new Date().toLocaleString('pt-BR'))
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Período: ", bold: true }),
          new TextRun(`${this.dataInicio || 'Todas'} até ${this.dataFim || 'Todas'}`)
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Sala: ", bold: true }),
          new TextRun(`${this.salaFiltro || 'Todas'}`)
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Status: ", bold: true }),
          new TextRun(`${this.statusFiltro === 'todos' ? 'Todos' : this.getStatusLabel(this.statusFiltro)}`)
        ],
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "ESTATÍSTICAS", bold: true, size: 24, color: "0052d4" })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Total de Reservas: ${this.reservasFiltradas.length}`, bold: true }),
          new TextRun({ text: `  |  Confirmadas: ${confirmadas.length}`, bold: true, color: "28a745" }),
          new TextRun({ text: `  |  Canceladas: ${canceladas.length}`, bold: true, color: "dc3545" })
        ],
        spacing: { after: 200 }
      })
    );

    const criarTabelaBonita = (titulo: string, dados: ReservaRelatorio[], cor: string) => {
      const elementos: any[] = [];
      
      elementos.push(
        new Paragraph({
          children: [
            new TextRun({ text: titulo, bold: true, size: 22, color: cor })
          ],
          spacing: { before: 200, after: 100 }
        })
      );
      
      if (dados.length === 0) {
        elementos.push(
          new Paragraph({
            children: [new TextRun({ text: "Nenhuma reserva encontrada.", italics: true, color: "999999" })],
            spacing: { after: 100 }
          })
        );
        return elementos;
      }
      
      const rows: TableRow[] = [];
      
      rows.push(
        new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Sala", bold: true, color: "ffffff" })] })], 
              shading: { fill: cor },
              width: { size: 20, type: WidthType.PERCENTAGE }
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Usuário", bold: true, color: "ffffff" })] })], 
              shading: { fill: cor },
              width: { size: 20, type: WidthType.PERCENTAGE }
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Data", bold: true, color: "ffffff" })] })], 
              shading: { fill: cor },
              width: { size: 15, type: WidthType.PERCENTAGE }
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Horário", bold: true, color: "ffffff" })] })], 
              shading: { fill: cor },
              width: { size: 25, type: WidthType.PERCENTAGE }
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Motivo", bold: true, color: "ffffff" })] })], 
              shading: { fill: cor },
              width: { size: 20, type: WidthType.PERCENTAGE }
            })
          ]
        })
      );
      
      for (let i = 0; i < dados.length; i++) {
        const item = dados[i];
        const isEven = i % 2 === 0;
        rows.push(
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph(item.salaNome)],
                shading: isEven ? { fill: "f8f9fa" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph(item.usuarioNome)],
                shading: isEven ? { fill: "f8f9fa" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph(this.formatarData(item.data))],
                shading: isEven ? { fill: "f8f9fa" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph(this.getHorarioLabel(item.horario))],
                shading: isEven ? { fill: "f8f9fa" } : undefined
              }),
              new TableCell({ 
                children: [new Paragraph(item.motivo || '-')],
                shading: isEven ? { fill: "f8f9fa" } : undefined
              })
            ]
          })
        );
      }
      
      elementos.push(
        new Table({
          rows: rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" }
          }
        })
      );
      
      return elementos;
    };

    children.push(...criarTabelaBonita("RESERVAS CONFIRMADAS", confirmadas, "28a745"));
    children.push(...criarTabelaBonita("RESERVAS CANCELADAS", canceladas, "dc3545"));

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SISTEMA DE AGENDAMENTO DE AMBIENTES ESCOLARES",
                    bold: true,
                    size: 24,
                    color: "0052d4"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "═══════════════════════════════════════════════════════════════",
                    color: "0052d4"
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "═══════════════════════════════════════════════════════════════",
                    color: "cccccc"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Sistema de Agendamento de Ambientes Escolares",
                    bold: true,
                    size: 18,
                    color: "666666"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Relatório gerado automaticamente pelo sistema",
                    size: 16,
                    color: "999999"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
                    size: 16,
                    color: "999999"
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        },
        children: children
      }]
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.docx`);
    this.presentToast('Documento DOCX exportado com sucesso!', 'success');
  }

exportarPDF() {
  if (this.reservasFiltradas.length === 0) {
    this.presentToast('Não há dados para exportar', 'warning');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Função para adicionar texto com suporte a acentos
  const addText = (text: string, x: number, y: number, options?: any) => {
    // Garantir que o texto seja string e remover caracteres problemáticos
    const cleanText = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    doc.text(cleanText, x, y, options);
  };
  
  // Cabeçalho
  doc.setFillColor(0, 82, 212);
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  doc.setFillColor(240, 248, 255);
  doc.rect(0, 12, pageWidth, 4, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  addText("SISTEMA DE AGENDAMENTO DE AMBIENTES ESCOLARES", pageWidth / 2, 8, { align: 'center' });
  
  // Título
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  addText("RELATORIO DE AGENDAMENTOS", pageWidth / 2, 28, { align: 'center' });
  
  // Linha decorativa
  doc.setDrawColor(0, 82, 212);
  doc.setLineWidth(0.5);
  doc.line(40, 33, pageWidth - 40, 33);
  
  // Informações do relatório
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let yPos = 42;
  
  addText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
  yPos += 6;
  addText(`Periodo: ${this.dataInicio || 'Todas'} ate ${this.dataFim || 'Todas'}`, 20, yPos);
  yPos += 6;
  addText(`Sala: ${this.salaFiltro || 'Todas'}`, 20, yPos);
  yPos += 6;
  addText(`Status: ${this.statusFiltro === 'todos' ? 'Todos' : this.getStatusLabel(this.statusFiltro)}`, 20, yPos);
  yPos += 15;
  
  // Estatísticas
  const confirmadas = this.reservasFiltradas.filter(r => r.status === 'confirmada');
  const canceladas = this.reservasFiltradas.filter(r => r.status === 'cancelada');
  
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(20, yPos, pageWidth - 40, 22, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(0, 82, 212);
  addText("ESTATISTICAS", 25, yPos + 6);
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  addText(`Total: ${this.reservasFiltradas.length} | Confirmadas: ${confirmadas.length} | Canceladas: ${canceladas.length}`, 25, yPos + 15);
  yPos += 32;
  
  // Tabela de dados
  const tableColumn = ["Sala", "Usuario", "Data", "Horario", "Status", "Motivo"];
  const tableRows = this.reservasFiltradas.map(r => {
    // Formatar data corretamente
    let dataFormatada = '';
    if (r.data) {
      const dataStr = r.data.split('T')[0];
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
      } else {
        dataFormatada = dataStr;
      }
    }
    
    return [
      r.salaNome || '',
      r.usuarioNome || '',
      dataFormatada,
      this.getHorarioLabel(r.horario) || '',
      this.getStatusLabel(r.status) || '',
      (r.motivo || '-').substring(0, 50)
    ];
  });
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: yPos,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 82, 212],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 22 },
      3: { cellWidth: 48 },
      4: { cellWidth: 22 },
      5: { cellWidth: 43 }
    },
    styles: {
      overflow: 'linebreak',
      valign: 'middle',
      font: 'helvetica'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      // Rodapé em cada página
      const currentPage = data.pageNumber;
      const totalPages = doc.getNumberOfPages();
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 12, pageWidth - 20, pageHeight - 12);
      
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Sistema de Agendamento de Ambientes Escolares",
        pageWidth / 2,
        pageHeight - 7,
        { align: 'center' }
      );
      doc.text(
        `Pagina ${currentPage} de ${totalPages}`,
        pageWidth - 20,
        pageHeight - 7,
        { align: 'right' }
      );
      doc.text(
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        20,
        pageHeight - 7,
        { align: 'left' }
      );
    }
  });
  
  doc.save(`relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.pdf`);
  this.presentToast('PDF exportado com sucesso!', 'success');
}

  baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
    const blob = new Blob([conteudo], { type: tipo });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.presentToast('Relatório exportado com sucesso!', 'success');
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}