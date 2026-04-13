// src/hooks/usePayments.js
import { useState, useEffect } from 'react';
import { getPayments } from '../services/paymentService';
import { transformJsonToMatrix } from '../utils/dataTransformers';

export const usePayments = () => {
  const [data, setData] = useState({ matrix: [], total: 0, progress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscripción en tiempo real a Firebase
    const unsubscribe = getPayments((rawJson) => {
      const processedData = transformJsonToMatrix(rawJson);
      setData(processedData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { ...data, loading };
};