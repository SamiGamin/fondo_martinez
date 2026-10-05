export const calculateFinances = (rawJson, selectedYear) => {
  if (!rawJson) {
    return {
      ingresos: 0,
      gastos: 0,
      balance: 0,
      ingresosAño: 0,
      gastosAño: 0,
      balanceAño: 0,
      ingresosTotal: 0,
      gastosTotal: 0,
      balanceTotal: 0,
      detalleGastos: [],
      detalleIngresos: [],
      detalleGastosTotal: [],
      detalleIngresosTotal: []
    };
  }

  const movimientos = Object.values(rawJson);
  const targetYear = selectedYear ? parseInt(selectedYear) : null;

  let ingresosTotal = 0;
  let gastosTotal = 0;
  let ingresosAño = 0;
  let gastosAño = 0;

  const detalleGastosTotal = [];
  const detalleIngresosTotal = [];
  const detalleGastosAño = [];
  const detalleIngresosAño = [];

  movimientos.forEach(mov => {
    const monto = parseFloat(mov.cuanto) || 0;
    const movDate = new Date(mov.fecha);
    const movYear = !isNaN(movDate.getFullYear()) ? movDate.getFullYear() : null;
    const matchesYear = targetYear ? movYear === targetYear : true;

    if (mov.tipo === 'deposito') {
      ingresosTotal += monto;
      const item = {
        id: mov.id || Math.random().toString(),
        fecha: mov.fecha,
        descripcion: mov.descripcion || 'Aporte mensual',
        monto: monto,
        quien: mov.quien || 'No especificado',
        tipo: 'deposito',
        año: movYear
      };
      detalleIngresosTotal.push(item);
      if (matchesYear) {
        ingresosAño += monto;
        detalleIngresosAño.push(item);
      }
    } else if (mov.tipo === 'gasto' || mov.tipo === 'retiro') {
      gastosTotal += monto;
      const item = {
        id: mov.id || Math.random().toString(),
        fecha: mov.fecha,
        descripcion: mov.descripcion || 'Gasto general (Sin descripción)',
        monto: monto,
        quien: mov.quien || 'No especificado',
        tipo: mov.tipo || 'gasto',
        año: movYear
      };
      detalleGastosTotal.push(item);
      if (matchesYear) {
        gastosAño += monto;
        detalleGastosAño.push(item);
      }
    }
  });

  // Ordenamos los movimientos: los más recientes arriba
  const sortByDateDesc = (a, b) => (b.fecha || 0) - (a.fecha || 0);
  detalleGastosTotal.sort(sortByDateDesc);
  detalleIngresosTotal.sort(sortByDateDesc);
  detalleGastosAño.sort(sortByDateDesc);
  detalleIngresosAño.sort(sortByDateDesc);

  return {
    // Los saldos principales SIEMPRE reflejan la totalidad sin importar el año
    // De esta manera: Ingresos - Gastos = Saldo Real SIEMPRE COINCIDE
    ingresos: ingresosTotal,
    gastos: gastosTotal,
    balance: ingresosTotal - gastosTotal,
    ingresosTotal,
    gastosTotal,
    balanceTotal: ingresosTotal - gastosTotal,
    ingresosAño,
    gastosAño,
    balanceAño: ingresosAño - gastosAño,
    // Detalle completo de movimientos para que cuadre exactamente con la tarjeta
    detalleGastos: detalleGastosTotal,
    detalleIngresos: detalleIngresosTotal,
    detalleGastosAño,
    detalleIngresosAño,
    detalleGastosTotal,
    detalleIngresosTotal
  };
};