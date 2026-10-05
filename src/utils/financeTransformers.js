export const calculateFinances = (rawJson) => {
  if (!rawJson) return { ingresos: 0, gastos: 0, balance: 0, detalleGastos: [], detalleIngresos: [] };

  const movimientos = Object.values(rawJson);
  let ingresos = 0;
  let gastos = 0;
  let detalleGastos = [];
  let detalleIngresos = [];

  movimientos.forEach(mov => {
    const monto = parseFloat(mov.cuanto) || 0;

    if (mov.tipo === 'deposito') {
      ingresos += monto;
      detalleIngresos.push({
        id: mov.id || Math.random().toString(),
        fecha: mov.fecha,
        descripcion: mov.descripcion || 'Aporte mensual',
        monto: monto,
        quien: mov.quien || 'No especificado',
        tipo: 'deposito'
      });
    } else if (mov.tipo === 'gasto' || mov.tipo === 'retiro') {
      gastos += monto;
      
      detalleGastos.push({
        id: mov.id || Math.random().toString(),
        fecha: mov.fecha,
        descripcion: mov.descripcion || 'Gasto general (Sin descripción)',
        monto: monto,
        quien: mov.quien || 'No especificado',
        tipo: mov.tipo || 'gasto'
      });
    }
  });

  // Ordenamos los movimientos: los más recientes arriba
  detalleGastos.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
  detalleIngresos.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

  return {
    ingresos,
    gastos,
    balance: ingresos - gastos,
    detalleGastos,
    detalleIngresos
  };
};