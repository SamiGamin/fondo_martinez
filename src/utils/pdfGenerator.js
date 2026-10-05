import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { transformJsonToMatrix } from './dataTransformers';

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
 * Genera un PDF maestro multianual donde CADA AÑO cabe exactamente en 1 SOLA HOJA,
 * conteniendo ambas tablas (Puntualidad y Matriz mensual) con la palabra PAGADO
 * en una sola línea horizontal nítida, sin saltos de línea ni amontonamientos.
 */
export const exportFondoPdf = ({
  rawItems = [],
  availableYears = [],
  finances = {},
  currentSelectedYear = new Date().getFullYear(),
  matrix = [],
  total = 0,
  year = null
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentYearNum = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Lista de años disponibles en orden descendente (ej: [2026, 2025])
  let yearsList = [];
  if (Array.isArray(availableYears) && availableYears.length > 0) {
    yearsList = [...availableYears].sort((a, b) => b - a);
  } else {
    const fallbackYear = parseInt(year || currentSelectedYear || currentYearNum);
    yearsList = [fallbackYear, fallbackYear - 1];
  }

  const boxMargin = 22;
  const usableWidth = pageWidth - (boxMargin * 2); // 568 pt

  // Función para ordenar hermanos estrictamente por nivel de cumplimiento y puntualidad
  const getSortedMatrix = (yr) => {
    const mData = transformJsonToMatrix(rawItems, yr);
    return [...mData.matrix].sort((a, b) => {
      const cuotasA = a.months.filter(Boolean).length;
      const cuotasB = b.months.filter(Boolean).length;
      if (cuotasB !== cuotasA) return cuotasB - cuotasA; // Del más puntual al menos

      let lastA = -1;
      let lastB = -1;
      for (let m = 11; m >= 0; m--) {
        if (a.months[m] && lastA === -1) lastA = m;
        if (b.months[m] && lastB === -1) lastB = m;
      }
      if (lastB !== lastA) return lastB - lastA;

      return (a.displayName || a.originalName).localeCompare(b.displayName || b.originalName);
    });
  };

  // Función para construir filas de la Tabla 1 (Resumen y Puntualidad)
  const buildTable1Rows = (sortedMatrix, yr, isCurrent) => {
    return sortedMatrix.map((row, idx) => {
      const numPagos = row.months.filter(Boolean).length;
      let lastMonthPaid = -1;
      for (let m = 11; m >= 0; m--) {
        if (row.months[m]) {
          lastMonthPaid = m;
          break;
        }
      }
      const ultimoMesTexto = lastMonthPaid === -1 ? 'Sin pagos' : `${MESES[lastMonthPaid]}`;

      let estado = '';
      if (isCurrent) {
        if (lastMonthPaid >= currentMonthIdx) {
          estado = lastMonthPaid > currentMonthIdx ? `Al Día (+${lastMonthPaid - currentMonthIdx} adel.)` : 'Al Día';
        } else {
          const pend = currentMonthIdx - lastMonthPaid;
          estado = `Pendiente ${pend} ${pend === 1 ? 'cuota' : 'cuotas'}`;
        }
      } else {
        if (numPagos === 12) {
          estado = 'Completó Año (12/12)';
        } else if (numPagos === 0) {
          estado = 'Sin aportes (0/12)';
        } else {
          estado = `Faltaron ${12 - numPagos} cuotas (${numPagos}/12)`;
        }
      }

      // Suma aportada en este año específico
      const aportesEnAno = (rawItems || [])
        .filter(item => {
          if (item.tipo !== 'deposito') return false;
          const itemDate = new Date(item.fecha);
          if (itemDate.getFullYear() !== parseInt(yr)) return false;
          const n1 = (item.quien || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          const n2 = (row.originalName || row.displayName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          return n1 === n2;
        })
        .reduce((sum, curr) => sum + (parseFloat(curr.cuanto) || 0), 0);

      return [
        `#${idx + 1}`,
        row.displayName || row.originalName,
        `${numPagos} de 12 meses`,
        formatMoney(aportesEnAno),
        ultimoMesTexto,
        estado
      ];
    });
  };

  // Generador de configuración de columnas para la Matriz Mensual (Tabla 2)
  // Garantiza que PAGADO no se divida nunca en 2 líneas
  const getMatrixColumnStyles = () => {
    const colStyles = {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 112 },
      14: { halign: 'center', fontStyle: 'bold', textColor: [30, 64, 175], cellWidth: 30 }
    };
    // 12 meses con 34 pt de ancho y padding horizontal reducido a 1 pt
    for (let m = 2; m <= 13; m++) {
      colStyles[m] = {
        cellWidth: 34,
        halign: 'center',
        fontSize: 6,
        cellPadding: { top: 2.2, bottom: 2.2, left: 1, right: 1 }
      };
    }
    return colStyles;
  };

  // ========================================================
  // GENERAR 1 HOJA POR CADA AÑO (AMBAS TABLAS EN LA MISMA HOJA)
  // ========================================================
  yearsList.forEach((yr, pageIndex) => {
    const isFirstPage = pageIndex === 0;
    const isCurrentYear = parseInt(yr) === currentYearNum;

    if (!isFirstPage) {
      doc.addPage();
    }

    const sortedYearData = getSortedMatrix(yr);

    if (isFirstPage) {
      // ----------------------------------------------------
      // HOJA 1: AÑO ACTUAL (2026) CON SALDOS GLOBALES UNIFICADOS
      // ----------------------------------------------------

      // 1. Encabezado Principal Compacto y Elegante
      doc.setFillColor(30, 58, 138); // Navy Blue elegante
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(`FONDO FAMILIAR MARTÍNEZ — AÑO ${yr}`, pageWidth / 2, 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(219, 234, 254);
      doc.text(`ESTADO GENERAL DE CUENTAS Y CONTROL DE PUNTUALIDAD • Fecha: ${fechaHoy}`, pageWidth / 2, 31, { align: 'center' });

      // 2. Tarjetas de Saldos Unificados (Aportes, Gastos, Saldo Real)
      const boxY = 46;
      const gap = 10;
      const boxWidth = (usableWidth - (gap * 2)) / 3; // ~182.6 pt
      const boxHeight = 32;

      // Caja 1: Ingresos Totales
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(boxMargin, boxY, boxWidth, boxHeight, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(22, 101, 52);
      doc.text('TOTAL APORTES RECAUDADOS', boxMargin + boxWidth / 2, boxY + 11, { align: 'center' });
      doc.setFontSize(10.5);
      doc.setTextColor(21, 128, 61);
      doc.text(formatMoney(finances?.ingresos || finances?.ingresosTotal || 0), boxMargin + boxWidth / 2, boxY + 25, { align: 'center' });

      // Caja 2: Gastos Totales
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(boxMargin + boxWidth + gap, boxY, boxWidth, boxHeight, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(159, 18, 57);
      doc.text('TOTAL GASTOS REALIZADOS', boxMargin + boxWidth + gap + boxWidth / 2, boxY + 11, { align: 'center' });
      doc.setFontSize(10.5);
      doc.setTextColor(225, 29, 72);
      doc.text(formatMoney(finances?.gastos || finances?.gastosTotal || 0), boxMargin + boxWidth + gap + boxWidth / 2, boxY + 25, { align: 'center' });

      // Caja 3: Saldo Real en Caja
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(boxMargin + (boxWidth + gap) * 2, boxY, boxWidth, boxHeight, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 64, 175);
      doc.text('SALDO DISPONIBLE EN CAJA', boxMargin + (boxWidth + gap) * 2 + boxWidth / 2, boxY + 11, { align: 'center' });
      doc.setFontSize(10.5);
      doc.setTextColor(29, 78, 216);
      doc.text(formatMoney(finances?.balance || finances?.balanceTotal || 0), boxMargin + (boxWidth + gap) * 2 + boxWidth / 2, boxY + 25, { align: 'center' });

      // 3. Título de Tabla 1
      const startT1 = 89;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`1. ESTADO DE CUOTAS Y PUNTUALIDAD — AÑO ${yr} (${isCurrentYear ? 'AÑO ACTUAL EN CURSO' : 'AÑO CERRADO'})`, boxMargin, startT1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Ordenado del familiar más puntual (#1) al que tiene pagos pendientes • Evaluado a la fecha', boxMargin, startT1 + 10);

      // Tabla 1: Resumen Individual
      const table1Rows = buildTable1Rows(sortedYearData, yr, isCurrentYear);
      autoTable(doc, {
        startY: startT1 + 14,
        margin: { left: boxMargin, right: boxMargin },
        head: [['#', 'Hermano / Familiar', 'Cuotas Pagadas', `Aportado en ${yr}`, 'Último Mes', 'Estado Actual']],
        body: table1Rows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
          1: { halign: 'left', fontStyle: 'bold', cellWidth: 148 },
          2: { halign: 'center', cellWidth: 80 },
          3: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52], cellWidth: 95 },
          4: { halign: 'center', cellWidth: 85 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 140 }
        },
        styles: {
          cellPadding: 2.4,
          fontSize: 7.2,
          overflow: 'linebreak'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = String(data.cell.raw || '');
            if (val.includes('Al Día') || val.includes('Completó') || val.includes('Completo')) {
              data.cell.styles.textColor = [22, 101, 52];
            } else if (val.includes('Pendiente') || val.includes('Faltaron') || val.includes('Sin aportes')) {
              data.cell.styles.textColor = [185, 28, 28];
            }
          }
        }
      });

      // 4. Separación limpia y Título de Tabla 2 (Matriz Ene - Dic)
      const t1End = doc.lastAutoTable.finalY || 280;
      const startT2 = t1End + 16;

      // Línea divisoria sutil para delimitar claramente ambas tablas
      doc.setDrawColor(226, 232, 240);
      doc.line(boxMargin, startT2 - 6, pageWidth - boxMargin, startT2 - 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. MATRIZ DETALLADA MES A MES (ENERO - DICIEMBRE ${yr})`, boxMargin, startT2 + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Visto bueno en verde (PAGADO) para cuotas canceladas y guion (-) para cuotas pendientes', boxMargin, startT2 + 14);

      // Tabla 2: Matriz Mensual
      const matrixHead = [['#', 'Hermano / Familiar', ...MESES_CORTOS, 'Total']];
      const matrixBody = sortedYearData.map((row, idx) => {
        const monthsStatus = row.months.map(paid => (paid ? 'PAGADO' : '-'));
        const totalMeses = row.months.filter(Boolean).length;
        return [
          `${idx + 1}`,
          row.displayName || row.originalName,
          ...monthsStatus,
          `${totalMeses}`
        ];
      });

      autoTable(doc, {
        startY: startT2 + 18,
        margin: { left: boxMargin, right: boxMargin },
        head: matrixHead,
        body: matrixBody,
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.2,
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: 1, right: 1 }
        },
        styles: {
          cellPadding: { top: 2.2, bottom: 2.2, left: 1, right: 1 },
          fontSize: 6.8,
          halign: 'center'
        },
        columnStyles: getMatrixColumnStyles(),
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 13) {
            if (data.cell.raw === 'PAGADO') {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [148, 163, 184];
            }
          }
        }
      });

    } else {
      // ----------------------------------------------------
      // HOJA 2 (Y SUBSECUENTES): AÑOS ANTERIORES CERRADOS (EJ: 2025)
      // TAMBIÉN CON SUS DOS TABLAS EN UNA SOLA HOJA
      // ----------------------------------------------------

      // 1. Encabezado del Año Anterior
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(`FONDO FAMILIAR MARTÍNEZ — CIERRE AÑO ${yr} (AÑO ANTERIOR)`, pageWidth / 2, 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(219, 234, 254);
      doc.text(`HISTORIAL DE CUMPLIMIENTO ANUAL CERRADO (12 MESES) • Fecha: ${fechaHoy}`, pageWidth / 2, 31, { align: 'center' });

      // 2. Título de Tabla 1
      const startT1Past = 52;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`1. ESTADO DE CUOTAS Y PUNTUALIDAD — AÑO ${yr} (CERRADO)`, boxMargin, startT1Past);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Evaluación completa de 12 cuotas del período • Ordenado del más cumplido al menos', boxMargin, startT1Past + 10);

      const table1PastRows = buildTable1Rows(sortedYearData, yr, false);
      autoTable(doc, {
        startY: startT1Past + 14,
        margin: { left: boxMargin, right: boxMargin },
        head: [['#', 'Hermano / Familiar', 'Cuotas Pagadas', `Aportado en ${yr}`, 'Último Mes', 'Estado Final']],
        body: table1PastRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
          1: { halign: 'left', fontStyle: 'bold', cellWidth: 148 },
          2: { halign: 'center', cellWidth: 80 },
          3: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52], cellWidth: 95 },
          4: { halign: 'center', cellWidth: 85 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 140 }
        },
        styles: {
          cellPadding: 2.4,
          fontSize: 7.2,
          overflow: 'linebreak'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = String(data.cell.raw || '');
            if (val.includes('Al Día') || val.includes('Completó') || val.includes('Completo')) {
              data.cell.styles.textColor = [22, 101, 52];
            } else if (val.includes('Pendiente') || val.includes('Faltaron') || val.includes('Sin aportes')) {
              data.cell.styles.textColor = [185, 28, 28];
            }
          }
        }
      });

      // 3. Separación limpia y Título de Tabla 2
      const t1PastEnd = doc.lastAutoTable.finalY || 280;
      const startT2Past = t1PastEnd + 16;

      doc.setDrawColor(226, 232, 240);
      doc.line(boxMargin, startT2Past - 6, pageWidth - boxMargin, startT2Past - 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. MATRIZ DETALLADA MES A MES (ENERO - DICIEMBRE ${yr})`, boxMargin, startT2Past + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Cuadrícula mes a mes del año cerrado • Verde para aportes realizados y (-) para faltantes', boxMargin, startT2Past + 14);

      const matrixHeadPast = [['#', 'Hermano / Familiar', ...MESES_CORTOS, 'Total']];
      const matrixBodyPast = sortedYearData.map((row, idx) => {
        const monthsStatus = row.months.map(paid => (paid ? 'PAGADO' : '-'));
        const totalMeses = row.months.filter(Boolean).length;
        return [
          `${idx + 1}`,
          row.displayName || row.originalName,
          ...monthsStatus,
          `${totalMeses}`
        ];
      });

      autoTable(doc, {
        startY: startT2Past + 18,
        margin: { left: boxMargin, right: boxMargin },
        head: matrixHeadPast,
        body: matrixBodyPast,
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.2,
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: 1, right: 1 }
        },
        styles: {
          cellPadding: { top: 2.2, bottom: 2.2, left: 1, right: 1 },
          fontSize: 6.8,
          halign: 'center'
        },
        columnStyles: getMatrixColumnStyles(),
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 13) {
            if (data.cell.raw === 'PAGADO') {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [148, 163, 184];
            }
          }
        }
      });
    }
  });

  // ==========================================
  // PIE DE PÁGINA GLOBAL EN TODAS LAS HOJAS
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Fondo Familiar Martínez • Reporte Oficial para Hermanos • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 14,
      { align: 'center' }
    );
  }

  // Descargar el archivo PDF automáticamente
  doc.save(`Reporte_General_Fondo_Martinez.pdf`);
};
