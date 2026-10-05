import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, LogOut, PlusCircle, TrendingDown, History, 
  DollarSign, Check, Trash2, Search, Loader2, Sparkles,
  AlertCircle, Calendar, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createPayment, deletePayment } from '../../services/paymentService';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const normalizar = (t) => (t || '').trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const AdminDashboardModal = ({ isOpen, onClose, matrix = [], rawItems = [], currentYear }) => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('deposito'); // 'deposito' | 'gasto' | 'historial'

  // Lista cerrada de hermanos existentes
  const familyMembers = useMemo(() => {
    const set = new Set();
    matrix.forEach(m => {
      if (m.originalName) set.add(m.originalName.trim());
      else if (m.displayName) set.add(m.displayName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [matrix]);

  // --- Estado Formulario Depósito ---
  const [depPerson, setDepPerson] = useState('');
  const [depYear, setDepYear] = useState(parseInt(currentYear) || new Date().getFullYear());
  const [depMonth, setDepMonth] = useState(new Date().getMonth());
  const [depAmount, setDepAmount] = useState('50000');
  const [depDesc, setDepDesc] = useState('');
  const [depSubmitting, setDepSubmitting] = useState(false);
  const [depSuccessMsg, setDepSuccessMsg] = useState('');

  // Obtiene el último pago registrado de una persona en toda la base de datos
  const getLastPaymentOfPerson = (personName) => {
    if (!personName) return null;
    const norm = normalizar(personName);
    const personDeposits = (rawItems || []).filter(item => 
      item.tipo === 'deposito' && item.fecha && normalizar(item.quien) === norm
    );

    if (personDeposits.length === 0) return null;

    // Ordenar de forma cronológica ascendente
    personDeposits.sort((a, b) => {
      const da = new Date(a.fecha);
      const db = new Date(b.fecha);
      return (da.getFullYear() * 12 + da.getMonth()) - (db.getFullYear() * 12 + db.getMonth());
    });

    const latest = personDeposits[personDeposits.length - 1];
    const date = new Date(latest.fecha);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      timestamp: latest.fecha
    };
  };

  // Calcula el mes y año consecutivo al último pago registrado
  const getNextMonthToPay = (personName) => {
    const last = getLastPaymentOfPerson(personName);
    if (!last) {
      return {
        year: parseInt(currentYear) || new Date().getFullYear(),
        month: 0 // Enero
      };
    }

    if (last.month === 11) {
      return {
        year: last.year + 1,
        month: 0 // Enero del año siguiente
      };
    } else {
      return {
        year: last.year,
        month: last.month + 1
      };
    }
  };

  // Al seleccionar el hermano, se calcula automáticamente el mes siguiente al último pagado
  const handleSelectPerson = (person) => {
    setDepPerson(person);
    if (!person) return;
    const next = getNextMonthToPay(person);
    setDepMonth(next.month);
    setDepYear(next.year);
  };

  // Meses ya pagados por la persona en el año seleccionado
  const paidMonthsForSelectedPersonAndYear = useMemo(() => {
    if (!depPerson) return new Set();
    const normPerson = normalizar(depPerson);
    const paidSet = new Set();
    
    (rawItems || []).forEach(item => {
      if (item.tipo === 'deposito' && item.fecha && normalizar(item.quien) === normPerson) {
        const d = new Date(item.fecha);
        if (d.getFullYear() === parseInt(depYear)) {
          paidSet.add(d.getMonth());
        }
      }
    });
    return paidSet;
  }, [rawItems, depPerson, depYear]);

  // Indicador si el mes actualmente seleccionado ya tiene un pago registrado
  const isCurrentMonthAlreadyPaid = depPerson ? paidMonthsForSelectedPersonAndYear.has(parseInt(depMonth)) : false;

  // Información del último pago de la persona seleccionada
  const lastPaymentInfo = useMemo(() => {
    if (!depPerson) return null;
    return getLastPaymentOfPerson(depPerson);
  }, [depPerson, rawItems]);

  useEffect(() => {
    if (currentYear && !depPerson) {
      setDepYear(parseInt(currentYear));
    }
  }, [currentYear, depPerson]);

  // --- Estado Formulario Gasto ---
  const [gasPerson, setGasPerson] = useState('');
  const [gasDesc, setGasDesc] = useState('');
  const [gasAmount, setGasAmount] = useState('');
  const [gasDate, setGasDate] = useState(new Date().toISOString().split('T')[0]);
  const [gasSubmitting, setGasSubmitting] = useState(false);
  const [gasSuccessMsg, setGasSuccessMsg] = useState('');

  // --- Estado Historial y Eliminación ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos'); // 'todos' | 'deposito' | 'gasto'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Hook useMemo para filtrado (Siempre antes de cualquier return)
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      const matchType = filterType === 'todos' || item.tipo === filterType;
      const search = searchTerm.toLowerCase();
      const matchSearch = !search || 
        (item.quien && item.quien.toLowerCase().includes(search)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(search));
      return matchType && matchSearch;
    });
  }, [rawItems, filterType, searchTerm]);

  const formatMoney = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(num);
  };

  // Guardar Depósito
  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!depPerson.trim()) {
      alert('Por favor selecciona un hermano de la lista');
      return;
    }

    // BLOQUEO ESTRICTO: No permitir registrar si el mes ya está pagado
    if (isCurrentMonthAlreadyPaid) {
      alert(`⚠️ Acción bloqueada: ${depPerson} ya tiene una cuota registrada en ${MESES[depMonth]} de ${depYear}. No se permiten pagos duplicados.`);
      return;
    }

    const amountNum = parseFloat(depAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setDepSubmitting(true);
    setDepSuccessMsg('');

    try {
      const targetDate = new Date(parseInt(depYear), parseInt(depMonth), 15, 12, 0, 0).getTime();
      const defaultDesc = depDesc.trim() || `Cuota ${MESES[depMonth]} ${depYear}`;

      await createPayment({
        tipo: 'deposito',
        quien: depPerson.trim(),
        cuanto: amountNum,
        fecha: targetDate,
        descripcion: defaultDesc
      });

      setDepSuccessMsg(`¡Aporte de ${depPerson} (${MESES[depMonth]} ${depYear}) registrado con éxito!`);
      setDepDesc('');

      // Avanzar automáticamente al siguiente mes consecutivo
      if (parseInt(depMonth) === 11) {
        setDepMonth(0);
        setDepYear(prev => parseInt(prev) + 1);
      } else {
        setDepMonth(prev => parseInt(prev) + 1);
      }

      setTimeout(() => setDepSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error al guardar el depósito: ' + err.message);
    } finally {
      setDepSubmitting(false);
    }
  };

  // Guardar Gasto
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!gasDesc.trim()) {
      alert('Por favor ingresa el concepto o descripción del gasto');
      return;
    }
    if (!gasPerson.trim()) {
      alert('Por favor selecciona el hermano responsable del gasto');
      return;
    }
    const amountNum = parseFloat(gasAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setGasSubmitting(true);
    setGasSuccessMsg('');

    try {
      const [year, month, day] = gasDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day, 12, 0, 0).getTime();

      await createPayment({
        tipo: 'gasto',
        quien: gasPerson.trim(),
        cuanto: amountNum,
        fecha: targetDate,
        descripcion: gasDesc.trim()
      });

      setGasSuccessMsg(`¡Gasto por ${formatMoney(amountNum)} registrado correctamente!`);
      setGasDesc('');
      setGasAmount('');
      setTimeout(() => setGasSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error al registrar el gasto: ' + err.message);
    } finally {
      setGasSubmitting(false);
    }
  };

  // Eliminar Movimiento
  const handleDeleteItem = async (id) => {
    setDeletingId(id);
    try {
      await deletePayment(id);
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Superior */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg md:text-xl text-slate-800 dark:text-slate-100">
                Panel de Administración
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                Sesión: <span className="text-blue-500 font-semibold">{currentUser?.email}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { logout(); onClose(); }}
              className="p-2 md:px-3 md:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 px-3 md:px-4 pt-2 gap-1.5 md:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('deposito')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 md:py-3 md:px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'deposito'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1e293b] rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" />
            <span>Registrar Cuota</span>
          </button>

          <button
            onClick={() => setActiveTab('gasto')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 md:py-3 md:px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'gasto'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1e293b] rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>Registrar Gasto</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 md:py-3 md:px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'historial'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1e293b] rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-blue-500" />
            <span>Historial / Eliminar ({rawItems.length})</span>
          </button>
        </div>

        {/* Contenido de Formularios */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/20 dark:bg-transparent">
          
          {/* TAB 1: REGISTRAR CUOTA */}
          {activeTab === 'deposito' && (
            <form onSubmit={handleCreateDeposit} className="space-y-4 max-w-md mx-auto py-2">
              {depSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>{depSuccessMsg}</span>
                </div>
              )}

              {/* Selector cerrado de hermanos */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Hermano / Familiar
                </label>
                <select
                  value={depPerson}
                  onChange={(e) => handleSelectPerson(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="">-- Selecciona un hermano --</option>
                  {familyMembers.map((fam, idx) => (
                    <option key={idx} value={fam}>{fam}</option>
                  ))}
                </select>

                {/* Banner de estado del hermano seleccionado */}
                {depPerson && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        {lastPaymentInfo ? (
                          <>Último pago: <strong className="text-slate-800 dark:text-slate-100">{MESES[lastPaymentInfo.month]} {lastPaymentInfo.year}</strong></>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Sin cuotas previas en el sistema</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <span>Siguiente: {MESES[depMonth]} {depYear}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mes y Año de la Cuota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Mes Aportado
                  </label>
                  <select
                    value={depMonth}
                    onChange={(e) => setDepMonth(parseInt(e.target.value))}
                    className={`w-full p-3 rounded-xl border text-sm outline-none cursor-pointer ${
                      isCurrentMonthAlreadyPaid
                        ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500'
                    }`}
                  >
                    {MESES.map((mes, idx) => {
                      const isPaid = paidMonthsForSelectedPersonAndYear.has(idx);
                      return (
                        <option key={idx} value={idx} disabled={isPaid}>
                          {mes} {isPaid ? '✓ (Ya registrado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Año
                  </label>
                  <select
                    value={depYear}
                    onChange={(e) => setDepYear(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alerta de bloqueo si el mes ya está pagado */}
              {isCurrentMonthAlreadyPaid && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>
                    {depPerson} ya tiene registrada la cuota de {MESES[depMonth]} {depYear}. No es posible registrar un pago duplicado.
                  </span>
                </div>
              )}

              {/* Monto con atajos rápidos */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Monto del Aporte
                </label>
                <div className="relative mb-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={depAmount}
                    onChange={(e) => setDepAmount(e.target.value)}
                    placeholder="50000"
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {['20000', '30000', '50000', '100000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepAmount(val)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        depAmount === val
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {formatMoney(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Descripción / Observación (Opcional)
                </label>
                <input
                  type="text"
                  value={depDesc}
                  onChange={(e) => setDepDesc(e.target.value)}
                  placeholder={`Ej: Cuota ${MESES[depMonth]} o Aporte por Nequi`}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={depSubmitting || isCurrentMonthAlreadyPaid || !depPerson}
                className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer ${
                  isCurrentMonthAlreadyPaid || !depPerson
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                } disabled:opacity-50`}
              >
                {depSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Cuota...</span>
                  </>
                ) : isCurrentMonthAlreadyPaid ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Mes ya registrado (Bloqueado)</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Guardar Cuota ({depPerson ? `${MESES[depMonth]} ${depYear}` : 'Selecciona hermano'})</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTRAR GASTO */}
          {activeTab === 'gasto' && (
            <form onSubmit={handleCreateExpense} className="space-y-4 max-w-md mx-auto py-2">
              {gasSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>{gasSuccessMsg}</span>
                </div>
              )}

              {/* Concepto del gasto */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Concepto / Descripción del Gasto *
                </label>
                <input
                  type="text"
                  value={gasDesc}
                  onChange={(e) => setGasDesc(e.target.value)}
                  placeholder="Ej: Pago de recibo de agua, Reparación..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Responsable del Gasto */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Responsable del Gasto *
                </label>
                <select
                  value={gasPerson}
                  onChange={(e) => setGasPerson(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="">-- Selecciona un hermano --</option>
                  {familyMembers.map((fam, idx) => (
                    <option key={idx} value={fam}>{fam}</option>
                  ))}
                </select>
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Monto Gastado *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={gasAmount}
                      onChange={(e) => setGasAmount(e.target.value)}
                      placeholder="25000"
                      required
                      className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Fecha del Gasto
                  </label>
                  <input
                    type="date"
                    value={gasDate}
                    onChange={(e) => setGasDate(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={gasSubmitting}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {gasSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Gasto...</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>Guardar Gasto en Firebase</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: HISTORIAL Y ELIMINACIÓN */}
          {activeTab === 'historial' && (
            <div className="space-y-4 py-1">
              
              {/* Filtros de Búsqueda */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por hermano o descripción..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                  {['todos', 'deposito', 'gasto'].map(tipo => (
                    <button
                      key={tipo}
                      onClick={() => setFilterType(tipo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        filterType === tipo
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tipo === 'deposito' ? 'Cuotas' : tipo === 'gasto' ? 'Gastos' : 'Todos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Registros */}
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {filteredItems.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 text-sm">
                    No hay movimientos que coincidan con la búsqueda.
                  </p>
                ) : (
                  filteredItems.map((item) => {
                    const isGasto = item.tipo === 'gasto' || item.tipo === 'retiro';
                    const fechaObj = new Date(item.fecha || item.creadoEn || Date.now());
                    const fechaLegible = fechaObj.toLocaleDateString('es-CO', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    });

                    return (
                      <div 
                        key={item.id} 
                        className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isGasto 
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isGasto ? <TrendingDown className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                                {item.quien || 'Sin Nombre'}
                              </p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isGasto 
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              }`}>
                                {isGasto ? 'Gasto' : 'Cuota'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 truncate">
                              {item.descripcion || (isGasto ? 'Gasto general' : 'Aporte')} • {fechaLegible}
                            </p>
                          </div>
                        </div>

                        {/* Monto y Botón de Eliminación */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <p className={`font-black text-xs sm:text-sm ${
                            isGasto ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {formatMoney(item.cuanto)}
                          </p>

                          {deleteConfirmId === item.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl animate-in fade-in">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deletingId === item.id}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                              >
                                {deletingId === item.id ? '...' : '¿Eliminar?'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Eliminar este registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminDashboardModal;
