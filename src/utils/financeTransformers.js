export const calculateFinances = (rawJson) => {
  if (!rawJson) return { ingresos: 0, gastos: 0, balance: 0, detalleGastos: [] };

  const movimientos = Object.values(rawJson);
  let ingresos = 0;
  let gastos = 0;
  let detalleGastos = [];

  movimientos.forEach(mov => {
    const monto = parseFloat(mov.cuanto) || 0;

    if (mov.tipo === 'deposito') {
      ingresos += monto;
    } else if (mov.tipo === 'gasto' || mov.tipo === 'retiro') {
      gastos += monto;
      
      // AHORA SÍ: Capturamos TODOS los datos posibles
      detalleGastos.push({
        id: mov.id || Math.random().toString(),
        fecha: mov.fecha,
        descripcion: mov.descripcion || 'Gasto general (Sin descripción)',
        monto: monto,
        quien: mov.quien || 'No especificado', // Capturamos a la persona
        tipo: mov.tipo || 'gasto'              // Capturamos el tipo exacto
      });
    }
  });

  // Ordenamos los gastos: los más recientes arriba
  detalleGastos.sort((a, b) => b.fecha - a.fecha);

  return {
    ingresos,
    gastos,
    balance: ingresos - gastos,
    detalleGastos
  };
};