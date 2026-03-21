import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calculator, Plus, Trash2, Download, RefreshCw, X, Receipt } from 'lucide-react';

import INITIAL_PRODUCTS from './data.json';


function App() {
  const [modo, setModo] = useState('libre'); // Solo 'libre' (menú libre)
  const [productos, setProductos] = useState(INITIAL_PRODUCTS);
  const [seleccionados, setSeleccionados] = useState([]);
  const [precioVenta, setPrecioVenta] = useState('');
  const [reporte, setReporte] = useState(null);
  
  // Estado para el modal de cantidad (Modo Libre)
  const [productoActual, setProductoActual] = useState(null);
  const [cantidadInput, setCantidadInput] = useState('1');

  // Calcular costo total
  const costoTotal = seleccionados.reduce((acc, item) => acc + item.costoTotalLinea, 0);

  const agregarProducto = (producto) => {
    // Modo libre: Abrir modal para pedir cantidad
    setProductoActual(producto);
    setCantidadInput('1');
  };

  const confirmarCantidadLibre = () => {
    const cantidad = parseFloat(cantidadInput);
    if (isNaN(cantidad) || cantidad <= 0) {
      alert("Por favor ingresa una cantidad válida mayor a 0.");
      return;
    }

    const nuevoItem = {
      ...productoActual,
      cantidadUsada: cantidad,
      costoTotalLinea: productoActual.precio * cantidad
    };

    setSeleccionados([...seleccionados, nuevoItem]);
    setProductoActual(null);
  };

  const eliminarProducto = (index) => {
    const nuevos = [...seleccionados];
    nuevos.splice(index, 1);
    setSeleccionados(nuevos);
  };

  const generarReporte = () => {
    if (seleccionados.length === 0) {
      alert("Selecciona ingredientes primero.");
      return;
    }
    const precio = parseFloat(precioVenta);
    if (isNaN(precio) || precio <= 0) {
      alert("Ingresa un precio de venta válido mayor a 0.");
      return;
    }

    const costoPorPeso = costoTotal / precio;
    
    setReporte({
      fecha: new Date().toLocaleString(),
      modo: 'Menú Libre',
      items: [...seleccionados],
      costoTotal: costoTotal,
      precioVenta: precio,
      costoPorPeso: costoPorPeso
    });
  };

  const reiniciarCalculo = () => {
    setSeleccionados([]);
    setPrecioVenta('');
    setReporte(null);
  };

  const descargarTXT = () => {
    if (!reporte) return;
    
    let contenido = `==== REPORTE DE COSTO ====\n`;
    contenido += `Fecha: ${reporte.fecha}\n`;
    contenido += `Modo: ${reporte.modo}\n`;
    contenido += `--------------------------\n`;
    
    reporte.items.forEach(item => {
      contenido += `- ${item.nombre}\n`;
      contenido += `  Precio U.: $${item.precio.toFixed(2)} | Cant.: ${item.cantidadUsada} | Costo: $${item.costoTotalLinea.toFixed(2)}\n`;
    });
    
    contenido += `--------------------------\n`;
    contenido += `Costo Total: $${reporte.costoTotal.toFixed(2)}\n`;
    contenido += `Precio de Venta: $${reporte.precioVenta.toFixed(2)}\n`;
    contenido += `Costo Real (%): ${(reporte.costoPorPeso * 100).toFixed(2)}%\n`;
    contenido += `==========================\n`;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Costo_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Pantalla de Inicio - Siempre muestra Menú Libre
  const [mostrarInicio, setMostrarInicio] = useState(true);
  
  if (mostrarInicio) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-6 text-center text-white">
            <Calculator className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-2xl font-bold">Calculador de Costo</h1>
            <p className="opacity-80 mt-2">Modo: Menú Libre</p>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-slate-600 dark:text-slate-300 text-center mb-4">
              Especificar cantidad/peso por cada producto
            </p>
            <button 
              onClick={() => setMostrarInicio(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              Comenzar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interfaz Principal
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-600 dark:text-blue-400" />
            <h1 className="font-bold text-lg hidden sm:block">Calculador Costos</h1>
            <span className="bg-emerald-100 dark:bg-emerald-700 text-emerald-600 dark:text-emerald-300 text-xs px-2 py-1 rounded-full font-medium ml-2">
              Menú Libre
            </span>
          </div>
          <button 
            onClick={() => { setModo(null); setSeleccionados([]); }}
            className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Cambiar Modo
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
        
        {/* Columna Izquierda: Productos */}
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col h-[calc(100vh-120px)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-lg">Productos Disponibles</h2>
              <p className="text-slate-500 text-sm">Toca para añadir a la receta</p>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {productos.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="p-3 text-left bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm hover:shadow-md flex justify-between items-center group"
                  >
                    <div>
                      <h4 className="font-medium">{p.nombre}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ${p.precio.toFixed(2)} / {p.unidad}
                      </p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Columna Derecha: Resumen / Carrito */}
        <section className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col h-[calc(100vh-120px)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden relative">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Receta Actual
              </h2>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 text-xs font-bold">
                {seleccionados.length} items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
              {seleccionados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Receipt className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Agrega productos para calcular el costo</p>
                </div>
              ) : (
                seleccionados.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-sm leading-tight">{item.nombre}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.cantidadUsada} {item.unidad} @ ${item.precio}/u
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold whitespace-nowrap">${item.costoTotalLinea.toFixed(2)}</span>
                      <button onClick={() => eliminarProducto(index)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer de Resumen y Acciones */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-4">
                <span className="text-slate-500 text-sm">Costo Total Receta:</span>
                <span className="text-3xl font-bold text-slate-800 dark:text-white">${costoTotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input 
                    type="number" 
                    placeholder="Precio Venta Sugerido" 
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <button 
                  onClick={generarReporte}
                  disabled={seleccionados.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  Calcular Rentabilidad
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Modal Modo Libre (Ingreso Cantidad) */}
      {productoActual && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setProductoActual(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Añadir {productoActual.nombre}</h3>
            <p className="text-slate-500 text-sm mb-4">Precio base: ${productoActual.precio} / {productoActual.unidad}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Cantidad ({productoActual.unidad}):</label>
              <input 
                type="number" 
                value={cantidadInput}
                onChange={(e) => setCantidadInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && confirmarCantidadLibre()}
                className="w-full px-4 py-3 text-lg bg-slate-50 dark:bg-slate-900 border-2 border-blue-100 dark:border-slate-700 rounded-xl focus:ring-0 focus:border-blue-500 outline-none"
              />
            </div>
            
            <button 
              onClick={confirmarCantidadLibre}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Agregar Ingrediente
            </button>
          </div>
        </div>
      )}

      {/* Modal Reporte Final (Reemplaza el bug de Python) */}
      {reporte && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-6 text-center border-b border-emerald-100 dark:border-emerald-800/50">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Resumen Creado</h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">Cálculo exitoso</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Costo Total</p>
                  <p className="text-xl font-bold">${reporte.costoTotal.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Precio Venta</p>
                  <p className="text-xl font-bold">${reporte.precioVenta.toFixed(2)}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                reporte.costoPorPeso <= 0.35 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}>
                <div>
                  <p className="font-bold">Porcentaje de Costo</p>
                  <p className="text-sm opacity-80">(Se recomienda ≤ 35%)</p>
                </div>
                <p className="text-3xl font-black">{(reporte.costoPorPeso * 100).toFixed(1)}%</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  onClick={descargarTXT}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Guardar TXT
                </button>
                <button 
                  onClick={reiniciarCalculo}
                  className="flex items-center justify-center gap-2 bg-blue-100 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 text-blue-800 dark:text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nuevo Cálculo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
