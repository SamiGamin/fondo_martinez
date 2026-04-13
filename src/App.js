import React, { useState } from 'react';
import { CheckCircle2, Circle, User, Wallet, CalendarDays } from 'lucide-react';
import { usePayments } from './hooks/usePayments'; // Tu hook de Firebase

const App = () => {
  // Estado para filtrar por año (puedes conectarlo a un select)
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Consumimos los datos en tiempo real de Firebase
  const { matrix, total, loading } = usePayments(year);
  
  // Variables estáticas para la UI
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const metaPorHermano = 12; 
  const cantidadHermanos = matrix.length || 1; // Evitar división por cero
  const metaTotalAnual = cantidadHermanos * metaPorHermano;
  const porcentajeProgreso = matrix.length > 0 ? Math.round((total / metaTotalAnual) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    // min-h-screen y padding dinámico (p-4 en móvil, p-8 en web)
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Responsivo */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Wallet className="text-blue-600" /> 
              Fondo Familiar
            </h1>
            <p className="text-gray-500 mt-1">Control de aportes en tiempo real</p>
          </div>
          
          {/* Selector de Año */}
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <CalendarDays size={20} className="text-gray-500" />
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="bg-transparent font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </header>

        {/* Tarjeta de Progreso Anual */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-3 items-end">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Meta Anual {year}</p>
              <p className="text-xl font-semibold text-gray-700">{total} de {metaTotalAnual} cuotas</p>
            </div>
            <span className="text-3xl font-black text-blue-600">{porcentajeProgreso}%</span>
          </div>
          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-1000 ease-out"
              style={{ width: `${porcentajeProgreso}%` }}
            />
          </div>
        </section>

        {/* Tarjeta de Matriz de Pagos */}
        <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Matriz de Pagos</h2>
          </div>

          {/* CONTENEDOR RESPONSIVO: overflow-x-auto es la clave para móviles */}
          <div className="overflow-x-auto w-full">
            {/* min-w-[800px] fuerza a que la tabla no se aplaste en pantallas pequeñas */}
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {/* Columna Sticky (Congelada a la izquierda) */}
                  <th className="sticky left-0 z-10 bg-gray-50 p-4 font-semibold text-gray-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Hermano
                  </th>
                  {meses.map(mes => (
                    <th key={mes} className="p-4 text-center font-bold text-gray-400 uppercase tracking-wider">
                      {mes}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    {/* Celda Sticky para el Nombre */}
                    <td className="sticky left-0 z-10 bg-white p-4 font-semibold text-gray-700 flex items-center gap-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User size={16} className="text-blue-600" />
                      </div>
                      {/* Mostrar solo el primer nombre */}
                      {row.name.split(' ')[0]}
                    </td>
                    
                    {/* Celdas de los meses */}
                    {row.months.map((pagado, mIdx) => (
                      <td key={mIdx} className="p-4 text-center">
                        {pagado ? (
                          <div className="flex flex-col items-center text-green-500">
                            <CheckCircle2 size={24} className="fill-green-100" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-200">
                            <Circle size={24} />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Leyenda */}
          <div className="p-4 bg-gray-50 flex gap-6 text-xs text-gray-500 justify-center md:justify-start">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Pagado / Al día</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-gray-200 rounded-full"></div> Pendiente</span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default App;