export const transformJsonToMatrix = (rawJson, selectedYear) => {
  if (!rawJson) return { matrix: [], total: 0 };

  const pagosArray = Object.values(rawJson);
  const normalizar = (t) => t.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const formatearNombre = (n) => {
    const p = n.trim().split(/\s+/);
    return p.length > 1 ? `${p[0]} ${p[1].charAt(0)}.` : p[0];
  };

  // Extraer nombres únicos limpiando duplicados reales en la base
  const nombresMap = {};
  pagosArray.forEach(p => {
    const norm = normalizar(p.quien);
    if (!nombresMap[norm]) nombresMap[norm] = p.quien.trim();
  });

  const siblings = Object.values(nombresMap).sort();
  
  const pagosDelAño = pagosArray.filter(p => {
    const fecha = new Date(p.fecha);
    return p.tipo === 'deposito' && fecha.getFullYear() === parseInt(selectedYear);
  });

  // Usar un Set para evitar cualquier duplicado de mes por persona
  const paymentsSet = new Set();
  pagosDelAño.forEach(p => {
    const month = new Date(p.fecha).getMonth();
    paymentsSet.add(`${normalizar(p.quien)}-${month}`);
  });

  const matrix = siblings.map(name => ({
    displayName: formatearNombre(name),
    originalName: name,
    months: Array.from({ length: 12 }, (_, m) => paymentsSet.has(`${normalizar(name)}-${m}`))
  }));

  return { matrix, total: pagosDelAño.length };
};