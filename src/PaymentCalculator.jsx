import React, { useState } from 'react';
import { Calculator, User, Calendar, DollarSign, Target } from 'lucide-react';

const PaymentCalculator = ({ matrix, year }) => {
  const [selectedPerson, setSelectedPerson] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [selectedTargetMonth, setSelectedTargetMonth] = useState(new Date().getMonth()); // Mes actual por defecto

  const currentMonth = new Date().getMonth(); // 0-11
  const currentYear = new Date().getFullYear();

  const getLastPaidMonth = (person) => {
    const personData = matrix.find(p => p.originalName === person || p.displayName === person);
    if (!personData) return -1;
    for (let i = 11; i >= 0; i--) {
      if (personData.months[i]) return i;
    }
    return -1;
  };

  const calculatePendingMonths = (lastPaid, targetMonth) => {
    if (lastPaid === -1) return targetMonth + 1; // No ha pagado nada, desde enero hasta el mes seleccionado
    const startMonth = lastPaid + 1;
    if (startMonth > targetMonth) return 0; // Ya pagó hasta después del mes objetivo
    return targetMonth - startMonth + 1; // Meses desde startMonth hasta targetMonth inclusive
  };

  const selectedPersonData = matrix.find(p => p.originalName === selectedPerson || p.displayName === selectedPerson);
  const lastPaidMonth = selectedPerson ? getLastPaidMonth(selectedPerson) : -1;
  const pendingMonths = selectedPerson ? calculatePendingMonths(lastPaidMonth, selectedTargetMonth) : 0;
  const totalToPay = monthlyAmount && pendingMonths ? parseFloat(monthlyAmount) * pendingMonths : 0;

  const formatMoney = (amount) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(amount);
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="bg-white dark:bg-[#1e293b] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Calculadora de Pagos</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Selecciona tu nombre
          </label>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecciona una persona</option>
            {matrix.map((person, idx) => (
              <option key={idx} value={person.originalName}>
                {person.displayName}
              </option>
            ))}
          </select>
        </div>

        {selectedPerson && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Último mes pagado</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {lastPaidMonth === -1 ? 'Ninguno' : monthNames[lastPaidMonth]}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Monto que pagas cada mes
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="Ej: 50000"
                  className="w-full pl-10 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Hasta qué mes quieres pagar
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedTargetMonth}
                  onChange={(e) => setSelectedTargetMonth(parseInt(e.target.value))}
                  className="w-full pl-10 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {monthlyAmount && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Resumen de cálculo</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Meses pendientes: <span className="font-bold">{pendingMonths}</span> (hasta {monthNames[selectedTargetMonth]})
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Monto por mes: <span className="font-bold">{formatMoney(monthlyAmount)}</span>
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    Total a pagar: {formatMoney(totalToPay)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCalculator;