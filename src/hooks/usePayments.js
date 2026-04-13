import { useState, useEffect } from 'react';
import { subscribeToPayments } from '../services/paymentService';
import { transformJsonToMatrix } from '../utils/dataTransformers';

export const usePayments = (year) => {
  const [data, setData] = useState({ matrix: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Apuntamos exactamente al nodo de tu imagen
    const dbPath = 'Fondo';

    const unsubscribe = subscribeToPayments(dbPath, (rawJson) => {
      // Le enviamos el JSON crudo y el año actual del filtro
      const processedData = transformJsonToMatrix(rawJson, year);
      setData(processedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [year]);

  return { ...data, loading };
};