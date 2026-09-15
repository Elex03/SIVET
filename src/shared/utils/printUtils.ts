import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import unaLogoPath from '../assets/images/UNA.png';

import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const downloadCompleteReport = async (elementId: string, filename: string, subtitle?: string) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error("No se encontró el elemento para el PDF");
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

  const buttons = element.querySelectorAll('button');
  const originalButtonDisplays: string[] = [];
  buttons.forEach(btn => {
    originalButtonDisplays.push(btn.style.display);
    btn.style.display = 'none';
  });

  const dropzone = element.querySelector('.border-dashed') as HTMLElement;
  let originalDropzoneDisplay = '';
  let originalDropzoneBorder = '';
  
  if (dropzone) {
    originalDropzoneDisplay = dropzone.style.display;
    originalDropzoneBorder = dropzone.style.border;
    
    const hasCharts = dropzone.querySelectorAll('.recharts-wrapper').length > 0;
    
    if (!hasCharts) {
      dropzone.style.display = 'none';
    } else {
      dropzone.style.border = 'none';
    }
  }

  const oldHeader = element.querySelector('.pdf-only-header') as HTMLElement;
  let originalOldHeaderDisplay = '';
  if (oldHeader) {
    originalOldHeaderDisplay = oldHeader.style.display;
    oldHeader.style.display = 'none';
  }

  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #304a6d; padding-bottom: 20px; margin-bottom: 30px;">
      <div style="flex-shrink: 0;">
        <img src="${unaLogoPath}" style="height: 75px; object-fit: contain;" alt="Logo UNA" />
      </div>
      <div style="text-align: right;">
        <h1 style="margin: 0; font-size: 26px; color: #304a6d; font-family: sans-serif; font-weight: 900; letter-spacing: 1px;">SIVET</h1>
        <h2 style="margin: 4px 0 0 0; font-size: 15px; color: #64748b; font-family: sans-serif; font-weight: 500;">Sistema de Inventario Veterinario</h2>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; color: #475569; font-family: sans-serif;">
      <div>
        <strong style="color: #304a6d;">Documento:</strong> ${filename.toUpperCase()}<br/>
        ${subtitle ? `<strong style="color: #304a6d;">Filtros:</strong> ${subtitle}` : ''}
      </div>
      <div style="text-align: right;">
        <strong style="color: #304a6d;">Fecha:</strong> ${dateStr}<br/>
        <strong style="color: #304a6d;">Hora:</strong> ${timeStr}
      </div>
    </div>
  `;
  element.insertBefore(headerDiv, element.firstChild);

  try {
    const dataUrl = await toPng(element, { 
      quality: 1, 
      pixelRatio: 2, 
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgProps = pdf.getImageProperties(dataUrl);
    const margin = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Incrustar imagen principal
    pdf.addImage(dataUrl, 'PNG', margin, margin, pdfWidth, pdfHeight);
    
    // Agregar Pie de Página oficial directo en el PDF
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150); // Gris claro
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.text(`Generado automáticamente por SIVET - Universidad Nacional Agraria © ${now.getFullYear()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    pdf.save(`${filename.replace(/\s+/g, '_')}_${dateStr.replace(/\s+/g, '')}.pdf`);
    
  } catch (error) {
    console.error("Error al generar el PDF: ", error);
  } finally {
    // --- LIMPIEZA Y RESTAURACIÓN DEL DOM ---
    headerDiv.remove(); // Eliminamos el encabezado inyectado
    
    if (oldHeader) oldHeader.style.display = originalOldHeaderDisplay;
    
    buttons.forEach((btn, i) => {
      btn.style.display = originalButtonDisplays[i];
    });

    if (dropzone) {
      dropzone.style.display = originalDropzoneDisplay;
      dropzone.style.border = originalDropzoneBorder;
    }
  }
};


// ==========================================
// 2. EXPORTADOR DE TABLA A PDF (Clásico)
// ==========================================
export interface PrintData {
  title: string;
  subtitle: string;
  columns: string[];
  data: (string | number)[][];
}

export const generatePDFTemplate = (printData: PrintData) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Logo_UNA_Nicaragua.png/240px-Logo_UNA_Nicaragua.png"; 

  const tableRows = printData.data.map(row => `
    <tr>
      ${row.map(cell => `<td>${cell}</td>`).join('')}
    </tr>
  `).join('');

  const tableHeaders = printData.columns.map(col => `<th>${col}</th>`).join('');

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${printData.title}</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #304a6d; padding-bottom: 20px; margin-bottom: 30px; }
        .header-logo img { height: 70px; object-fit: contain; }
        .header-info { text-align: right; }
        .header-info h1 { margin: 0; font-size: 24px; color: #304a6d; }
        .header-info h2 { margin: 5px 0 0 0; font-size: 16px; color: #666; font-weight: normal; }
        .meta-data { margin-bottom: 30px; font-size: 14px; color: #555; display: flex; justify-content: space-between;}
        table { border-collapse: collapse; margin-bottom: 30px; width: 100%; }
        th { background-color: #f3f4f6; color: #304a6d; font-weight: 600; text-transform: uppercase; font-size: 12px; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #4b5563; }
        tr:nth-child(even) td { background-color: #f9fafb; }
        .footer { position: fixed; bottom: 20px; width: calc(100% - 80px); text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        @media print {
          body { padding: 0; }
          .footer { position: fixed; bottom: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-logo">
          <img src="${logoUrl}" alt="Logo UNA" onerror="this.style.display='none'" />
        </div>
        <div class="header-info">
          <h1>SIVET</h1>
          <h2>Sistema de Inventario Veterinario</h2>
        </div>
      </div>
      
      <div class="meta-data">
        <div>
          <strong>Documento:</strong> ${printData.title}<br/>
          <strong>Referencia:</strong> ${printData.subtitle}
        </div>
        <div style="text-align: right;">
          <strong>Fecha:</strong> ${dateStr}<br/>
          <strong>Hora:</strong> ${timeStr}
        </div>
      </div>

      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        Generado automáticamente por SIVET - Universidad Nacional Agraria &copy; ${now.getFullYear()}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlTemplate);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};


// ==========================================
// 3. EXPORTADOR A EXCEL
// ==========================================
export interface ExportData {
  title: string;
  subtitle?: string;
  columns: string[];
  data: (string | number)[][];
}

const fetchImageAsBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("No se pudo cargar el logo de la UNA para el Excel", error);
    return null;
  }
};

export const generateExcel = async (exportData: ExportData) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIVET - UNA';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Reporte', {
    views: [{ showGridLines: false }]
  });

  const columnWidths = exportData.columns.map((col, i) => {
    const maxDataLength = Math.max(...exportData.data.map(row => String(row[i] || '').length));
    return { width: Math.max(col.length, maxDataLength) + 6 };
  });
  worksheet.columns = columnWidths;

  const base64Logo = await fetchImageAsBase64(unaLogoPath);
  if (base64Logo) {
    const logoId = workbook.addImage({
      base64: base64Logo,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 75, height: 75 }
    });
  }

  worksheet.mergeCells('C1', 'F1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'UNIVERSIDAD NACIONAL AGRARIA';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF304A6D' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('C2', 'F2');
  const docTitleCell = worksheet.getCell('C2');
  docTitleCell.value = exportData.title.toUpperCase();
  docTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF4B5563' } };
  docTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  if (exportData.subtitle) {
    worksheet.mergeCells('C3', 'F3');
    const subtitleCell = worksheet.getCell('C3');
    subtitleCell.value = exportData.subtitle;
    subtitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF6B7280' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  worksheet.getCell('A5').value = `Emitido el: ${new Date().toLocaleString()}`;
  worksheet.getCell('A5').font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };

  worksheet.addRow([]);

  const headerRow = worksheet.addRow(exportData.columns);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF304A6D' } };
    cell.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, bold: true, size: 10.5 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });

  exportData.data.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;
    const isEven = index % 2 === 0;
    
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } };
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF374151' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        left: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        right: { style: 'hair', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  const safeTitle = exportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${safeTitle}_${dateStr}.xlsx`);
};