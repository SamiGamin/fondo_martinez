import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, User, CalendarDays, Trophy, Moon, Sun, TrendingDown, TrendingUp, PiggyBank, X, Info, ShieldCheck, Lock, Search, FileDown, History } from 'lucide-react';
import { usePayments } from './hooks/usePayments';
import { useAuth } from './context/AuthContext';
import PaymentCalculator from './PaymentCalculator';
import AdminLoginModal from './components/admin/AdminLoginModal';
import AdminDashboardModal from './components/admin/AdminDashboardModal';
import { exportFondoPdf } from './utils/pdfGenerator';

const App = () => {
  const currentYearNum = new Date().getFullYear();
  const [year, setYear] = useState(currentYearNum);
  const isPastYear = parseInt(year) < currentYearNum;

  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  const { isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomePersonFilter, setIncomePersonFilter] = useState('');

  const { matrix, total, finances, rawItems, loading } = usePayments(year);

  // Años disponibles detectados dinámicamente + actual y anterior
  const availableYears = useMemo(() => {
    const yearsSet = new Set([currentYearNum, currentYearNum - 1]);
    (rawItems || []).forEach(item => {
      if (item.fecha) {
        const y = new Date(item.fecha).getFullYear();
        if (!isNaN(y) && y >= 2020 && y <= currentYearNum + 1) {
          yearsSet.add(y);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [rawItems, currentYearNum]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  // --- 2. Lógica para detectar si se puede instalar la App ---
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const ready = (e) => {
      e.preventDefault(); // Evita que Chrome decida por su cuenta
      setInstallPrompt(e); // Guarda el evento en el estado
    };

    window.addEventListener('beforeinstallprompt', ready);

    return () => window.removeEventListener('beforeinstallprompt', ready);
  }, []);

  // Función para disparar la instalación cuando el usuario toque el botón
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const matrixOrdenada = [...matrix].sort((a, b) => {
    const pagosA = a.months.filter(Boolean).length;
    const pagosB = b.months.filter(Boolean).length;
    return pagosB - pagosA;
  });

  const metaTotalAnual = (matrix.length || 1) * 12;
  const porcentajeProgreso = matrix.length > 0 ? Math.round((total / metaTotalAnual) * 100) : 0;

  const formatMoney = (amount) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('.') + '.';
  };

  const filteredIngresos = (finances?.detalleIngresos || []).filter(item => {
    const matchPerson = !incomePersonFilter || item.quien === incomePersonFilter;
    const search = incomeSearch.toLowerCase().trim();
    const matchSearch = !search || 
      (item.quien && item.quien.toLowerCase().includes(search)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(search));
    return matchPerson && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <div className="animate-spin rounded-full h-10 w-10 md:h-16 md:w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8 font-sans transition-colors duration-500 bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-300 relative">
      <div className="max-w-7xl mx-auto space-y-3 md:space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#1e293b] p-3 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-4 bg-blue-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/20">
                <img src="/pwa-192x192.png" alt="Fondo Familiar" className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <div>
                <h1 className="text-base md:text-3xl font-black dark:text-slate-100">Fondo Familiar</h1>
                <p className="text-[10px] md:text-sm text-slate-400">Aportes en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:hidden">
              {/* Botón Descargar PDF Móvil */}
              <button 
                onClick={() => exportFondoPdf({ rawItems, availableYears, finances, currentSelectedYear: year, matrix, total })} 
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                title="Descargar Reporte PDF"
              >
                <FileDown size={18} />
              </button>
              <button 
                onClick={() => isAdmin ? setShowAdminModal(true) : setShowLoginModal(true)} 
                className={`p-2 rounded-lg transition-all ${
                  isAdmin 
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title={isAdmin ? "Panel Admin" : "Acceso Administrador"}
              >
                {isAdmin ? <ShieldCheck size={18} /> : <Lock size={18} />}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Botón Descargar PDF Desktop */}
            <button
              onClick={() => exportFondoPdf({ rawItems, availableYears, finances, currentSelectedYear: year, matrix, total })}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-sm"
              title="Descargar Reporte en PDF"
            >
              <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Reporte PDF</span>
            </button>

            {/* Botón Admin Desktop */}
            <div className="hidden md:flex">
              {isAdmin ? (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs md:text-sm font-bold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Panel Admin</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Acceso Administrador"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Admin</span>
                </button>
              )}
            </div>

            <div className="hidden md:flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button onClick={() => setDarkMode(false)} className={`p-2 rounded-lg transition-all ${!darkMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><Sun size={20} /></button>
              <button onClick={() => setDarkMode(true)} className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-slate-700 shadow-sm text-yellow-400' : 'text-slate-400'}`}><Moon size={20} /></button>
            </div>
            <div className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 md:px-5 py-1.5 md:py-3 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700">
              <CalendarDays className="text-blue-500 w-4 h-4 md:w-5 md:h-5" />
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                className="bg-transparent font-bold text-xs md:text-base outline-none dark:text-slate-200 cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y === currentYearNum 
                      ? `${y} (Actual)` 
                      : y === currentYearNum - 1 
                        ? `${y} (Año Anterior)` 
                        : `Año ${y}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Banner Informativo cuando se revisa un año anterior */}
        {isPastYear && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3 md:p-4 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold text-amber-900 dark:text-amber-200">
                  Estás revisando el año histórico {year}
                </p>
                <p className="text-[11px] md:text-xs text-amber-700 dark:text-amber-400">
                  Las cuotas, aportes, gastos y reportes mostrados corresponden a los registros cerrados de {year}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setYear(currentYearNum)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap self-end sm:self-auto"
            >
              Volver al Año Actual ({currentYearNum})
            </button>
          </div>
        )}

        {/* Aviso de Instalación - Solo aparece si no está instalada */}
{installPrompt && (
  <div className="bg-blue-600 p-3 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/20 rounded-lg">
        <img src="/pwa-192x192.png" alt="Fondo Familiar" className="w-[18px] h-[18px]" />
      </div>
      <p className="text-white text-xs font-bold">Instala la App de Fondo Familiar</p>
    </div>
    <button 
      onClick={handleInstallClick}
      className="bg-white text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider"
    >
      Instalar
    </button>
  </div>
)}

        {/* Resumen Financiero */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <div 
            onClick={() => setShowIncomeModal(true)}
            className="group bg-white dark:bg-[#1e293b] p-2 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all relative"
          >
            <div className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors">
              <Info className="w-3 h-3 md:w-5 md:h-5" />
            </div>
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
              <TrendingUp className="text-emerald-500 w-3 h-3 md:w-5 md:h-5 hidden sm:block group-hover:text-emerald-600 transition-colors" />
              <p className="text-[14px] md:text-xs font-black text-slate-400 uppercase tracking-tighter md:tracking-widest group-hover:text-emerald-500 transition-colors">
                Ingresos
              </p>
            </div>
            <p className="text-[16px] sm:text-lg md:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">{formatMoney(finances?.ingresos)}</p>
          </div>
          
          <div 
            onClick={() => setShowExpensesModal(true)}
            className="group bg-white dark:bg-[#1e293b] p-2 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-rose-300 dark:hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all relative"
          >
            <div className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-400 transition-colors">
              <Info className="w-3 h-3 md:w-5 md:h-5" />
            </div>
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
              <TrendingDown className="text-rose-500 w-3 h-3 md:w-5 md:h-5 hidden sm:block group-hover:text-rose-600 transition-colors" />
              <p className="text-[14px] md:text-xs font-black text-slate-400 uppercase tracking-tighter md:tracking-widest group-hover:text-rose-500 transition-colors">
                Gastos
              </p>
            </div>
            <p className="text-[16px] sm:text-lg md:text-3xl font-black text-rose-600 dark:text-rose-400 truncate">{formatMoney(finances?.gastos)}</p>
          </div>

          <div className="bg-blue-600 p-2 md:p-6 rounded-2xl md:rounded-3xl shadow-lg border border-blue-500">
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
              <PiggyBank className="text-blue-100 w-3 h-3 md:w-5 md:h-5 hidden sm:block" />
              <p className="text-[14px] md:text-xs font-black text-blue-100 uppercase tracking-tighter md:tracking-widest">
                Saldo Real en Caja
              </p>
            </div>
            <p className="text-[16px] sm:text-lg md:text-3xl font-black text-white truncate">{formatMoney(finances?.balance)}</p>
          </div>
        </div>

        {/* Progreso */}
        <section className="bg-white dark:bg-[#1e293b] p-2 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-1.5 md:mb-4">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-1">
              <p className="text-[8px] md:text-sm font-black text-blue-500 uppercase tracking-widest">Progreso {year}</p>
              <p className="text-[9px] md:text-3xl font-bold dark:text-slate-100">
                {total} <span className="text-slate-400 font-normal md:text-xl">/ {metaTotalAnual} cuotas</span>
              </p>
            </div>
            <p className="text-xs md:text-5xl font-black text-blue-500 italic">{porcentajeProgreso}%</p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 md:h-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000" style={{ width: `${porcentajeProgreso}%` }} />
          </div>
        </section>

        {/* Calculadora de Pagos */}
        <PaymentCalculator matrix={matrix} year={year} />

        {/* Tabla Responsiva Optimizada */}
        <section className="bg-white dark:bg-[#1e293b] rounded-2xl md:rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
            <div>
              <h2 className="text-sm md:text-lg font-black text-slate-800 dark:text-slate-100">
                Aportes por Hermano ({year})
              </h2>
              <p className="text-[11px] md:text-xs text-slate-400">
                Control mensual de cuotas y estado individual
              </p>
            </div>
            <button
              onClick={() => exportFondoPdf({ rawItems, availableYears, finances, currentSelectedYear: year, matrix, total })}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar Reporte PDF</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full md:min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 p-2 md:p-6 font-bold text-slate-400 text-[8px] md:text-xs uppercase border-b border-slate-100 dark:border-slate-700">
                    <span className="md:hidden">Nom</span>
                    <span className="hidden md:inline">Hermano</span>
                  </th>
                  {meses.map(mes => (
                    <th key={mes} className="p-1 md:p-6 text-center font-bold text-slate-400 text-[8px] md:text-xs uppercase border-b border-slate-100 dark:border-slate-700">
                      <span className="md:hidden">{mes.charAt(0)}</span>
                      <span className="hidden md:inline">{mes}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {matrixOrdenada.map((row, idx) => {
                  const numPagos = row.months.filter(Boolean).length;
                  return (
                    <tr key={idx} className="group transition-colors md:hover:bg-blue-50/30 dark:md:hover:bg-blue-900/10">
                      <td className="sticky left-0 z-10 bg-white dark:bg-[#1e293b] p-2 md:p-6 border-r border-slate-100 dark:border-slate-800/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] md:group-hover:bg-blue-50/30 dark:md:group-hover:bg-transparent">
                        <div className="flex items-center gap-1.5 md:gap-4">
                          <div className={`hidden sm:flex w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-xl items-center justify-center ${idx === 0 && numPagos > 0 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {idx === 0 && numPagos > 0 ? <Trophy className="w-3.5 h-3.5 md:w-6 md:h-6" /> : <User className="w-3.5 h-3.5 md:w-6 md:h-6" />}
                          </div>
                          <div className="min-w-[28px] md:min-w-[120px]">
                            <p className="md:hidden font-black text-[10px] dark:text-slate-200">{getInitials(row.displayName || row.name)}</p>
                            <p className="hidden md:block font-bold text-base dark:text-slate-100">{row.displayName || row.name}</p>
                            <p className="text-[7px] md:text-xs text-slate-400 font-medium uppercase md:mt-1">{numPagos} meses</p>
                          </div>
                        </div>
                      </td>
                      {row.months.map((pagado, mIdx) => (
                        <td key={mIdx} className="p-1 md:p-6">
                          <div className="flex justify-center">
                            {pagado ? (
                              <CheckCircle2 className="w-3.5 h-3.5 md:w-7 md:h-7 text-emerald-500/80 md:text-emerald-500" />
                            ) : (
                              <div className="relative flex items-center justify-center opacity-30 md:opacity-50">
                                <Circle className="w-3.5 h-3.5 md:w-7 md:h-7 text-amber-500/40 md:text-amber-500/30 stroke-[1.5px] md:stroke-2" />
                                <div className="absolute w-0.5 h-0.5 md:w-1.5 md:h-1.5 bg-amber-500 md:bg-amber-400 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal de Gastos (También más amplio en PC) */}
      {showExpensesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md md:max-w-2xl rounded-3xl md:rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl md:rounded-2xl text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-bold md:text-xl text-slate-800 dark:text-slate-100">Historial de Gastos</h3>
                  <p className="text-[10px] md:text-sm text-slate-400">
                    Total Gastos Realizados: {formatMoney(finances?.gastos)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowExpensesModal(false)} 
                className="p-2 md:p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-transparent">
              {finances?.detalleGastos?.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {finances.detalleGastos.map((gasto, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 bg-white dark:bg-slate-800/40 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm gap-2">
                      <div className="pr-4 flex-1">
                        <p className="font-bold text-sm md:text-lg text-slate-700 dark:text-slate-200 leading-tight">
                          {gasto.descripcion}
                        </p>
                        <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-1 md:mt-2 flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          {gasto.quien && gasto.quien !== 'No especificado' ? gasto.quien : 'Fondo Común (Sin Nombre)'}
                        </p>
                        <p className="text-[10px] md:text-sm text-slate-400 mt-1.5 md:mt-2 font-medium tracking-wide flex items-center gap-1">
                          <CalendarDays size={14} />
                          {new Date(gasto.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-700/50 sm:border-0">
                        <p className="font-black text-rose-500 dark:text-rose-400 text-base md:text-2xl">
                          {formatMoney(gasto.monto)}
                        </p>
                        <span className="text-[9px] md:text-xs uppercase tracking-widest font-bold px-2 md:px-3 py-0.5 md:py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-md mt-1 md:mt-2">
                          {gasto.tipo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 md:py-20 text-slate-400">
                  <TrendingDown className="w-12 h-12 md:w-20 md:h-20 mb-3 opacity-20" />
                  <p className="text-sm md:text-lg font-medium">No hay gastos registrados aún</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Modal de Ingresos con Filtros */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md md:max-w-2xl rounded-3xl md:rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl md:rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-bold md:text-xl text-slate-800 dark:text-slate-100">Historial de Ingresos</h3>
                  <p className="text-[10px] md:text-sm text-slate-400">
                    Total Aportes Recibidos ({filteredIngresos.length}): {formatMoney(finances?.ingresos)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowIncomeModal(false)} 
                className="p-2 md:p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Barra de Filtros */}
            <div className="p-3 md:p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  placeholder="Buscar por hermano o concepto..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none"
                />
              </div>

              <select
                value={incomePersonFilter}
                onChange={(e) => setIncomePersonFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none cursor-pointer"
              >
                <option value="">Todos los hermanos</option>
                {matrix.map((p, idx) => (
                  <option key={idx} value={p.originalName || p.displayName}>
                    {p.displayName || p.originalName}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de Aportes */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-transparent">
              {filteredIngresos.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {filteredIngresos.map((ingreso, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 bg-white dark:bg-slate-800/40 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm gap-2">
                      <div className="pr-4 flex-1">
                        <p className="font-bold text-sm md:text-lg text-slate-700 dark:text-slate-200 leading-tight">
                          {ingreso.descripcion}
                        </p>
                        <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-1 md:mt-2 flex items-center gap-1.5 font-medium">
                          <User size={14} className="text-emerald-500" />
                          {ingreso.quien}
                        </p>
                        <p className="text-[10px] md:text-sm text-slate-400 mt-1.5 md:mt-2 font-medium tracking-wide flex items-center gap-1">
                          <CalendarDays size={14} />
                          {new Date(ingreso.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-700/50 sm:border-0">
                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-2xl">
                          +{formatMoney(ingreso.monto)}
                        </p>
                        <span className="text-[9px] md:text-xs uppercase tracking-widest font-bold px-2 md:px-3 py-0.5 md:py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md mt-1 md:mt-2">
                          Aporte
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 md:py-20 text-slate-400">
                  <TrendingUp className="w-12 h-12 md:w-20 md:h-20 mb-3 opacity-20" />
                  <p className="text-sm md:text-lg font-medium">No se encontraron aportes registrados</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Modales de Administración */}
      {showLoginModal && (
        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowAdminModal(true)}
        />
      )}

      {showAdminModal && (
        <AdminDashboardModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          matrix={matrix}
          rawItems={rawItems}
          currentYear={year}
        />
      )}

    </div>
  );
};

export default App;