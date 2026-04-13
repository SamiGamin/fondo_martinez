export const transformJsonToMatrix = (rawJson, selectedYear) => {
  // Si la base de datos está vacía, retornamos los valores por defecto
  if (!rawJson) return { matrix: [], total: 0 };

  // Convertimos el objeto de Firebase en un array plano
  const pagosArray = Object.values(rawJson);

  // 1. Filtrar solo los depósitos válidos que coincidan con el año del select
  const pagosDelAño = pagosArray.filter(p => {
    if (p.tipo !== 'deposito') return false;
    
    // Convertimos los milisegundos a un objeto Date real
    const fecha = new Date(p.fecha);
    return fecha.getFullYear() === parseInt(selectedYear);
  });

  // 2. Extraer los nombres únicos de los hermanos de toda la base de datos
  // (Para que aparezcan en la tabla incluso si no han pagado este año)
  const siblings = [...new Set(pagosArray.map(p => p.quien))].sort();
  
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  // 3. Crear el mapa de búsqueda rápida O(1)
  const paymentsMap = new Map();
  pagosDelAño.forEach(p => {
    const month = new Date(p.fecha).getMonth(); // 0 es Enero, 11 es Diciembre
    paymentsMap.set(`${p.quien}-${month}`, true);
  });

  // 4. Construir la matriz para la interfaz
  const matrix = siblings.map(name => ({
    name,
    months: months.map(m => paymentsMap.has(`${name}-${m}`))
  }));

  // Retornamos la matriz y el total de cuotas pagadas en ese año
  return { matrix, total: pagosDelAño.length };
};