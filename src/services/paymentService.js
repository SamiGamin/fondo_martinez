import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { db } from '../api/firebase';

/**
 * Suscribirse a los cambios en tiempo real de la base de datos
 */
export const subscribeToPayments = (path, onDataUpdate) => {
  const paymentsRef = ref(db, path);
  const unsubscribe = onValue(paymentsRef, (snapshot) => {
    const rawJson = snapshot.val();
    onDataUpdate(rawJson || {});
  });
  return unsubscribe;
};

/**
 * Registrar un nuevo movimiento (deposito o gasto) en el nodo Fondo
 * Mantiene la compatibilidad exacta con la app Android (FondoData)
 */
export const createPayment = async ({ tipo, quien, cuanto, fecha, descripcion = null, soporteUrl = null }) => {
  const fondoRef = ref(db, 'Fondo');
  const newItemRef = push(fondoRef);
  const uniqueId = newItemRef.key;

  const item = {
    id: uniqueId,
    tipo: tipo, // "deposito" o "gasto"
    quien: quien.trim(),
    cuanto: parseFloat(cuanto) || 0,
    fecha: typeof fecha === 'number' ? fecha : new Date(fecha).getTime(),
    soporteUrl: soporteUrl || null,
    creadoEn: Date.now(),
    descripcion: descripcion ? descripcion.trim() : null
  };

  await set(newItemRef, item);
  return item;
};

/**
 * Actualizar un movimiento existente en el nodo Fondo
 */
export const updatePayment = async (id, updatedFields) => {
  if (!id) throw new Error('ID requerido para actualizar');
  const itemRef = ref(db, `Fondo/${id}`);

  const cleanData = { ...updatedFields };
  if (cleanData.cuanto !== undefined) {
    cleanData.cuanto = parseFloat(cleanData.cuanto) || 0;
  }
  if (cleanData.fecha && typeof cleanData.fecha !== 'number') {
    cleanData.fecha = new Date(cleanData.fecha).getTime();
  }
  if (cleanData.quien) {
    cleanData.quien = cleanData.quien.trim();
  }

  await update(itemRef, cleanData);
  return true;
};

/**
 * Eliminar un movimiento del nodo Fondo
 */
export const deletePayment = async (id) => {
  if (!id) throw new Error('ID requerido para eliminar');
  const itemRef = ref(db, `Fondo/${id}`);
  await remove(itemRef);
  return true;
};