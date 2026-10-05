import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatMoney = (amount) => {
  if (!amount || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Genera un PDF claro, explicativo y con tablas detalladas para los hermanos del Fondo
 */
export const exportFondoPdf = ({ matrix = [], finances = {}, year = new Date().getFullYear(), total = 0 }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentYearNum = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // Fecha actual legible
  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isPastYear = parseInt(year) < currentYearNum;

  // --- 1. ENCABEZADO ---
  doc.setFillColor(30, 64, 175); // Azul Royal
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('FONDO FAMILIAR MARTÍNEZ', pageWidth / 2, 34, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(219, 234, 254);
  const subEncabezado = isPastYear
    ? `INFORME ANUAL Y CIERRE DE CUENTAS - AÑO ${year} (AÑO ANTERIOR)`
    : `ESTADO DE CUENTA Y REPORTE DE APORTES - AÑO ${year}`;
  doc.text(subEncabezado, pageWidth / 2, 52, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Emitido el: ${fechaHoy}`, pageWidth / 2, 66, { align: 'center' });

  // --- 2. TARJETAS DE RESUMEN FINANCIERO ---
  const boxY = 88;
  const boxWidth = (pageWidth - 80 - 20) / 3;
  const boxHeight = 52;

  // Caja 1: Ingresos
  doc.setFillColor(240, 253, 244); // Verde suave
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(40, boxY, boxWidth, boxHeight, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text(`TOTAL APORTES (${year})`, 40 + boxWidth / 2, boxY + 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(21, 128, 61);
  doc.text(formatMoney(finances?.ingresos || 0), 40 + boxWidth / 2, boxY + 38, { align: 'center' });

  // Caja 2: Gastos
  doc.setFillColor(255, 241, 242); // Rosa suave
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(40 + boxWidth + 10, boxY, boxWidth, boxHeight, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(159, 18, 57);
  doc.text(`TOTAL GASTOS (${year})`, 40 + boxWidth + 10 + boxWidth / 2, boxY + 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text(formatMoney(finances?.gastos || 0), 40 + boxWidth + 10 + boxWidth / 2, boxY + 38, { align: 'center' });

  // Caja 3: Saldo Real
  doc.setFillColor(239, 246, 255); // Azul suave
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(40 + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text('SALDO DISPONIBLE EN CAJA', 40 + (boxWidth + 10) * 2 + boxWidth / 2, boxY + 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(29, 78, 216);
  doc.text(formatMoney(finances?.balance || 0), 40 + (boxWidth + 10) * 2 + boxWidth / 2, boxY + 38, { align: 'center' });

  // --- 3. EXPLICACIÓN AMIGABLE PARA FAMILIARES ---
  let startY = 152;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, startY, pageWidth - 80, 40, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('GUÍA EXPLICATIVA DEL REPORTE:', 50, startY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const explicacion = !isPastYear
    ? `Estamos en el año actual (${year}), mes de ${MESES[currentMonthIdx]}. En la primera tabla puedes ver cuántas cuotas ha pagado cada hermano, el total aportado, su último mes cubierto y si está "Al Día" o si tiene cuotas pendientes. En la segunda tabla ves el detalle mes por mes.`
    : `Reporte del año finalizado (${year}). En la primera tabla se muestra el total aportado durante ese año, cuántos meses cubrió de los 12 y si completó el año al 100% o cuántas cuotas le quedaron pendientes. En la segunda tabla ves el detalle mes a mes.`;
  doc.text(doc.splitTextToSize(explicacion, pageWidth - 100), 50, startY + 26);

  // --- 4. TABLA 1: RESUMEN EXPLICADO POR HERMANO ---
  startY = 202;

  const tableRows = matrix.map((row) => {
    const numPagos = row.months.filter(Boolean).length;
    
    // Último mes pagado
    let lastMonthPaid = -1;
    for (let m = 11; m >= 0; m--) {
      if (row.months[m]) {
        lastMonthPaid = m;
        break;
      }
    }
    const ultimoMesTexto = lastMonthPaid === -1 ? 'Sin pagos' : `${MESES[lastMonthPaid]}`;

    // Estado calculado para que cualquiera lo entienda
    let estado = '';
    if (parseInt(year) === currentYearNum) {
      if (lastMonthPaid >= currentMonthIdx) {
        if (lastMonthPaid > currentMonthIdx) {
          estado = `Al Día (+${lastMonthPaid - currentMonthIdx} adelant.)`;
        } else {
          estado = 'Al Día';
        }
      } else {
        const pendientes = currentMonthIdx - lastMonthPaid;
        estado = `Pendiente ${pendientes} ${pendientes === 1 ? 'cuota' : 'cuotas'}`;
      }
    } else if (isPastYear) {
      if (numPagos === 12) {
        estado = 'Completó Año (12/12)';
      } else if (numPagos === 0) {
        estado = 'Sin aportes (0/12)';
      } else {
        estado = `Faltaron ${12 - numPagos} cuotas (${numPagos}/12)`;
      }
    } else {
      estado = `${numPagos} cuotas`;
    }

    // Calcular aportes totales de la persona en el año
    const aportesPersona = (finances?.detalleIngresos || [])
      .filter(i => {
        const n1 = (i.quien || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const n2 = (row.originalName || row.displayName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return n1 === n2;
      })
      .reduce((sum, curr) => sum + (curr.monto || 0), 0);

    return [
      row.displayName || row.originalName,
      `${numPagos} de 12 meses`,
      formatMoney(aportesPersona),
      ultimoMesTexto,
      estado
    ];
  });

  autoTable(doc, {
    startY: startY,
    margin: { left: 40, right: 40 },
    head: [['Hermano / Familiar', 'Cuotas Pagadas', 'Total Aportado', 'Último Mes Cubierto', 'Estado Actual']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', fontSize: 8.5 },
      1: { halign: 'center', fontSize: 8.5 },
      2: { halign: 'right', fontStyle: 'bold', fontSize: 8.5, textColor: [22, 101, 52] },
      3: { halign: 'center', fontSize: 8.5 },
      4: { halign: 'center', fontStyle: 'bold', fontSize: 8.5 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = String(data.cell.raw || '');
        if (val.includes('Al Día') || val.includes('Completó') || val.includes('Completo')) {
          data.cell.styles.textColor = [22, 101, 52]; // Verde
        } else if (val.includes('Pendiente') || val.includes('Faltaron') || val.includes('Sin aportes') || val.includes('faltantes')) {
          data.cell.styles.textColor = [185, 28, 28]; // Rojo
        }
      }
    },
    styles: {
      cellPadding: 4.5,
      fontSize: 8,
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // --- 5. TABLA 2: MATRIZ MENSUAL (ENERO - DICIEMBRE) ---
  const matrixTableY = doc.lastAutoTable.finalY + 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`TABLA DETALLADA MES A MES (${year})`, 40, matrixTableY);

  const matrixHead = [['Hermano', ...MESES_CORTOS, 'Total']];
  const matrixBody = matrix.map(row => {
    const monthsStatus = row.months.map(paid => (paid ? 'PAGADO' : '-'));
    const totalMeses = row.months.filter(Boolean).length;
    return [
      row.displayName || row.originalName,
      ...monthsStatus,
      `${totalMeses}`
    ];
  });

  autoTable(doc, {
    startY: matrixTableY + 6,
    margin: { left: 40, right: 40 },
    head: matrixHead,
    body: matrixBody,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center'
    },
    styles: {
      cellPadding: 3,
      fontSize: 6.5,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', minCellWidth: 65 },
      13: { halign: 'center', fontStyle: 'bold', textColor: [30, 64, 175] }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 1 && data.column.index <= 12) {
        if (data.cell.raw === 'PAGADO') {
          data.cell.styles.fillColor = [220, 252, 231]; // Verde claro
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [148, 163, 184];
        }
      }
    }
  });

  // --- 6. PIE DE PÁGINA ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Fondo Familiar Martínez • Documento informativo para familiares • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center' }
    );
  }

  // Descargar el archivo PDF automáticamente
  doc.save(`Estado_Cuenta_Fondo_Martinez_${year}.pdf`);
};
