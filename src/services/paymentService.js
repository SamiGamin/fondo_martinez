import { ref, onValue } from 'firebase/database';
import { db } from '../api/firebase';

// Asegúrate de que diga "export const subscribeToPayments"
export const subscribeToPayments = (path, onDataUpdate) => {
  const paymentsRef = ref(db, path);
  const unsubscribe = onValue(paymentsRef, (snapshot) => {
    const rawJson = snapshot.val();
    onDataUpdate(rawJson || {});
  });
  return unsubscribe;
};