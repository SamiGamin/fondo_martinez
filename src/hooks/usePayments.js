import { useState, useEffect } from 'react';
import { subscribeToPayments } from '../services/paymentService';
import { transformJsonToMatrix } from '../utils/dataTransformers';
import { calculateFinances } from '../utils/financeTransformers'; 

export const usePayments = (year) => {
  const [data, setData] = useState({ 
    matrix: [], 
    total: 0, 
    finances: { ingresos: 0, gastos: 0, balance: 0 },
    rawItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const dbPath = 'Fondo'; 

    const unsubscribe = subscribeToPayments(dbPath, (rawJson) => {
      const matrixData = transformJsonToMatrix(rawJson, year);
      const financesData = calculateFinances(rawJson, year);

      const rawList = Object.entries(rawJson || {}).map(([key, val]) => ({
        ...val,
        originalId: val.id,
        id: key,
        firebaseKey: key
      })).sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

      setData({
        matrix: matrixData.matrix,
        total: matrixData.totalCuotas || matrixData.total || 0,
        finances: financesData,
        rawItems: rawList
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [year]);

  return { ...data, loading };
};