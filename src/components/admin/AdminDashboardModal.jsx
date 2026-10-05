import React, { useState, useMemo } from 'react';
import { 
  X, LogOut, PlusCircle, TrendingDown, History, User, 
  Calendar, DollarSign, Check, Trash2, Edit3, Search, 
  AlertTriangle, Loader2, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createPayment, updatePayment, deletePayment } from '../../services/paymentService';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const AdminDashboardModal = ({ isOpen, onClose, matrix = [], rawItems = [], currentYear }) => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('deposito'); // 'deposito' | 'gasto' | 'historial'

  // Lista de familiares únicos existentes
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
  const [depCustomPerson, setDepCustomPerson] = useState('');
  const [depYear, setDepYear] = useState(currentYear || new Date().getFullYear());
  const [depMonth, setDepMonth] = useState(new Date().getMonth());
  const [depAmount, setDepAmount] = useState('50000');
  const [depDesc, setDepDesc] = useState('');
  const [depSubmitting, setDepSubmitting] = useState(false);
  const [depSuccessMsg, setDepSuccessMsg] = useState('');

  // --- Estado Formulario Gasto ---
  const [gasPerson, setGasPerson] = useState('Fondo Común');
  const [gasCustomPerson, setGasCustomPerson] = useState('');
  const [gasDesc, setGasDesc] = useState('');
  const [gasAmount, setGasAmount] = useState('');
  const [gasDate, setGasDate] = useState(new Date().toISOString().split('T')[0]);
  const [gasSubmitting, setGasSubmitting] = useState(false);
  const [gasSuccessMsg, setGasSuccessMsg] = useState('');

  // --- Estado Historial y Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos'); // 'todos' | 'deposito' | 'gasto'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // --- Estado Edición ---
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPerson, setEditPerson] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  if (!isOpen) return null;

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
    const finalPerson = depPerson === '__otro__' ? depCustomPerson.trim() : depPerson.trim();
    if (!finalPerson) {
      alert('Por favor selecciona o escribe el nombre del familiar');
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
      // Fecha fijada en el día 15 del mes seleccionado para coincidir con la matriz mensual
      const targetDate = new Date(parseInt(depYear), parseInt(depMonth), 15, 12, 0, 0).getTime();
      const defaultDesc = depDesc.trim() || `Cuota ${MESES[depMonth]} ${depYear}`;

      await createPayment({
        tipo: 'deposito',
        quien: finalPerson,
        cuanto: amountNum,
        fecha: targetDate,
        descripcion: defaultDesc
      });

      setDepSuccessMsg(`¡Aporte de ${finalPerson} (${MESES[depMonth]}) registrado con éxito!`);
      setDepDesc('');
      if (depPerson === '__otro__') {
        setDepPerson(finalPerson);
        setDepCustomPerson('');
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
    const finalPerson = gasPerson === '__otro__' ? gasCustomPerson.trim() : gasPerson.trim();
    if (!gasDesc.trim()) {
      alert('Por favor ingresa el concepto o descripción del gasto');
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
        quien: finalPerson || 'Fondo Común',
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

  // Iniciar Edición
  const startEdit = (item) => {
    setEditingItem(item);
    setEditAmount(item.cuanto || '');
    setEditPerson(item.quien || '');
    setEditDesc(item.descripcion || '');
    const dateObj = new Date(item.fecha || Date.now());
    setEditDate(dateObj.toISOString().split('T')[0]);
  };

  // Guardar Edición
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditSubmitting(true);
    try {
      const [y, m, d] = editDate.split('-').map(Number);
      const updatedTimestamp = new Date(y, m - 1, d, 12, 0, 0).getTime();

      await updatePayment(editingItem.id, {
        quien: editPerson.trim(),
        cuanto: parseFloat(editAmount) || 0,
        descripcion: editDesc.trim(),
        fecha: updatedTimestamp
      });

      setEditingItem(null);
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filtrado de items para la pestaña de historial
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
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
              className="p-2 md:px-3 md:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Pestañas (Tabs) */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('deposito')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all shrink-0 ${
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
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all shrink-0 ${
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
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all shrink-0 ${
              activeTab === 'historial'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1e293b] rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-blue-500" />
            <span>Historial y Gestión ({rawItems.length})</span>
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/20 dark:bg-transparent">
          
          {/* TAB 1: REGISTRAR DEPÓSITO */}
          {activeTab === 'deposito' && (
            <form onSubmit={handleCreateDeposit} className="space-y-4 max-w-xl mx-auto py-2">
              {depSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>{depSuccessMsg}</span>
                </div>
              )}

              {/* Familiar */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Familiar / Persona
                </label>
                <select
                  value={depPerson}
                  onChange={(e) => setDepPerson(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Seleccionar Persona --</option>
                  {familyMembers.map((fam, idx) => (
                    <option key={idx} value={fam}>{fam}</option>
                  ))}
                  <option value="__otro__">➕ Otro familiar (Escribir nombre)...</option>
                </select>

                {depPerson === '__otro__' && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      value={depCustomPerson}
                      onChange={(e) => setDepCustomPerson(e.target.value)}
                      placeholder="Escribe el nombre completo..."
                      required
                      className="w-full p-3 rounded-xl border border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 text-slate-800 dark:text-slate-100 text-sm outline-none"
                    />
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
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {MESES.map((mes, idx) => (
                      <option key={idx} value={idx}>{mes}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Año
                  </label>
                  <select
                    value={depYear}
                    onChange={(e) => setDepYear(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

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
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
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
                  placeholder={`Ej: Cuota ${MESES[depMonth]} o Depósito Nequi`}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={depSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {depSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Aporte...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Guardar Cuota en Firebase</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTRAR GASTO */}
          {activeTab === 'gasto' && (
            <form onSubmit={handleCreateExpense} className="space-y-4 max-w-xl mx-auto py-2">
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
                  placeholder="Ej: Pago de recibo de agua, Pintura fachada..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Responsable del Gasto */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Responsable / Quién realizó el gasto
                </label>
                <select
                  value={gasPerson}
                  onChange={(e) => setGasPerson(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="Fondo Común">Fondo Común</option>
                  {familyMembers.map((fam, idx) => (
                    <option key={idx} value={fam}>{fam}</option>
                  ))}
                  <option value="__otro__">➕ Otra persona...</option>
                </select>

                {gasPerson === '__otro__' && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      value={gasCustomPerson}
                      onChange={(e) => setGasCustomPerson(e.target.value)}
                      placeholder="Escribe el nombre del responsable..."
                      required
                      className="w-full p-3 rounded-xl border border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20 text-slate-800 dark:text-slate-100 text-sm outline-none"
                    />
                  </div>
                )}
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

          {/* TAB 3: HISTORIAL Y GESTIÓN */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              
              {/* Filtros de Búsqueda */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por familiar o descripción..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {['todos', 'deposito', 'gasto'].map(tipo => (
                    <button
                      key={tipo}
                      onClick={() => setFilterType(tipo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
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

              {/* Lista de Movimientos */}
              <div className="space-y-2.5">
                {filteredItems.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 text-sm">
                    No se encontraron movimientos registrados con esos filtros.
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
                        className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                            isGasto 
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isGasto ? <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" /> : <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                                {item.quien || 'Sin Nombre'}
                              </p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isGasto 
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              }`}>
                                {isGasto ? 'Gasto' : 'Cuota'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 truncate">
                              {item.descripcion || (isGasto ? 'Sin concepto' : 'Aporte mensual')} • {fechaLegible}
                            </p>
                          </div>
                        </div>

                        {/* Monto y Botones de Acción */}
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                          <p className={`font-black text-xs sm:text-base ${
                            isGasto ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {formatMoney(item.cuanto)}
                          </p>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                              title="Editar movimiento"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl">
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  disabled={deletingId === item.id}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all"
                                >
                                  {deletingId === item.id ? '...' : 'Confirmar'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Eliminar movimiento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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

      {/* SUB-MODAL DE EDICIÓN */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
                <Edit3 className="w-4 h-4 text-blue-500" />
                Editar Movimiento
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre / Responsable</label>
                <input
                  type="text"
                  value={editPerson}
                  onChange={(e) => setEditPerson(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Monto ($)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {editSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardModal;
