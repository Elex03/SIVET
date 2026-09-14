
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import unaLogoPath from '../assets/images/UNA.png';


export interface PrintData {
  title: string;
  subtitle: string;
  columns: string[];
  data: (string | number)[][];
}

export const generatePDFTemplate = (printData: PrintData) => {
  // Obtener fecha y hora actual formateada
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

  // URL del logo de la UNA (PNG transparente ideal para reportes)
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Logo_UNA_Nicaragua.png/240px-Logo_UNA_Nicaragua.png"; 

  // Construir filas de la tabla
  const tableRows = printData.data.map(row => `
    <tr>
      ${row.map(cell => `<td>${cell}</td>`).join('')}
    </tr>
  `).join('');

  // Construir encabezados
  const tableHeaders = printData.columns.map(col => `<th>${col}</th>`).join('');

  // Plantilla HTML con CSS inyectado (Optimizada para la hoja A4 de impresión)
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

  // Crear ventana invisible e imprimir
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlTemplate);
    printWindow.document.close();
    
    // Esperar un breve instante para que la imagen (logo) cargue antes de llamar a print()
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};

export interface ExportData {
  title: string;
  subtitle?: string;
  columns: string[];
  data: (string | number)[][];
}

// Función auxiliar para convertir una imagen local (path) a Buffer o Base64 para ExcelJS
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
  // 1. Crear el libro de trabajo y la hoja
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIVET - UNA';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Reporte', {
    views: [{ showGridLines: false }] // Oculta las líneas de cuadrícula para un look más formal
  });

  // 2. Definir anchos de columna automáticos basados en el contenido
  const columnWidths = exportData.columns.map((col, i) => {
    const maxDataLength = Math.max(...exportData.data.map(row => String(row[i] || '').length));
    return { width: Math.max(col.length, maxDataLength) + 6 }; // Margen de holgura
  });
  worksheet.columns = columnWidths;

  // 3. Crustar el logo de la UNA local de manera dinámica
  const base64Logo = await fetchImageAsBase64(unaLogoPath);
  if (base64Logo) {
    const logoId = workbook.addImage({
      base64: base64Logo,
      extension: 'png',
    });
    // Se posiciona elegantemente ocupando el bloque superior izquierdo (Col A-B, Filas 1 a 3)
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 75, height: 75 }
    });
  }

  // 4. Encabezados Institucionales (Diseño corporativo UNA)
  worksheet.mergeCells('C1', 'F1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'UNIVERSIDAD NACIONAL AGRARIA';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF304A6D' } }; // Azul institucional SIVET
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

  // Fecha y hora de emisión al pie del encabezado
  worksheet.getCell('A5').value = `Emitido el: ${new Date().toLocaleString()}`;
  worksheet.getCell('A5').font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };

  // Fila vacía de separación
  worksheet.addRow([]);

  // 6. Cabecera de la Tabla (Estilo Sólido con fuente blanca)
  const headerRow = worksheet.addRow(exportData.columns);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF304A6D' } // Azul corporativo SIVET
    };
    cell.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, bold: true, size: 10.5 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });

  // 7. Filas de Datos con formato cebra (alternando blancos y grises muy suaves)
  exportData.data.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;
    const isEven = index % 2 === 0;
    
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } 
      };
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF374151' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        left: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        right: { style: 'hair', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  // 8. Generar y disparar la descarga del archivo Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  const safeTitle = exportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${safeTitle}_${dateStr}.xlsx`);
};