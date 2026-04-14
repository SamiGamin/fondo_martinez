import { useState, useEffect } from 'react';
import { subscribeToPayments } from '../services/paymentService';
import { transformJsonToMatrix } from '../utils/dataTransformers';
// 1. Asegúrate de importar el nuevo utilitario
import { calculateFinances } from '../utils/financeTransformers'; 

export const usePayments = (year) => {
  // 2. Iniciamos el estado con finances en 0
  const [data, setData] = useState({ 
    matrix: [], 
    total: 0, 
    finances: { ingresos: 0, gastos: 0, balance: 0 } 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const dbPath = 'Fondo'; 

    const unsubscribe = subscribeToPayments(dbPath, (rawJson) => {
      // 3. Procesamos los datos con AMBOS archivos
      const matrixData = transformJsonToMatrix(rawJson, year);
      const financesData = calculateFinances(rawJson, year);

      // 4. Guardamos todo junto en el estado
      setData({
        matrix: matrixData.matrix,
        total: matrixData.totalCuotas || matrixData.total || 0, // Por si acaso
        finances: financesData // Aquí se inyecta la plata
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [year]);

  return { ...data, loading };
};