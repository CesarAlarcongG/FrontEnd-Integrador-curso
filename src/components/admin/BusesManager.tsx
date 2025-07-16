import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bus, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import ApiService from '../../services/api';

interface Asiento {
  idAsiento: number;
  piso: number;
  fila: string;
  columna: string;
  descripcion: string;
  estado: string;
  idBus: number;
}

interface Bus {
  idCarro: number;
  placa: string;
  idConductor: number;
  conductor?: {
    nombre: string;
    apellido: string;
    dni?: string;  
  };
  asientos?: Asiento[];
}

const BusesManager: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    idConductor: ''
  });
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
    const [asientoForm, setAsientoForm] = useState({
    piso: 1,
    fila: '',
    columna: '',
    descripcion: '',
    estado: 'DISPONIBLE',
    idBus: 0
  });
  const [showAsientoForm, setShowAsientoForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [busesResponse, conductoresResponse] = await Promise.all([
        ApiService.obtenerBuses(),
        ApiService.obtenerConductores()
      ]);

      // Mapear los buses para incluir la información del conductor
      const busesConConductores = busesResponse.map(bus => {
        const conductor = conductoresResponse.find(c => c.idTrabajador === bus.idConductor);
        return {
          ...bus,
          conductor: conductor ? {
            nombre: conductor.nombre,
            apellido: conductor.apellido,
            dni: conductor.dni
          } : undefined
        };
      });

      setBuses(busesConConductores);
      setConductores(conductoresResponse);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadBusDetails = async (bus: Bus) => {
    try {
      setLoading(true);
      setError(null);
      const detalles = await ApiService.obtenerAsientosPorBus(bus.idCarro);
      const updatedBus = { ...bus, asientos: detalles };
      setBuses(buses.map(b => b.idCarro === bus.idCarro ? updatedBus : b));
      setSelectedBus(updatedBus);
    } catch (error) {
      console.error('Error al cargar detalles del bus:', error);
      setError('Error al cargar los detalles del bus.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingBus) {
        await ApiService.editarBus(editingBus.idCarro, {
          ...formData,
          idConductor: parseInt(formData.idConductor)
        });
      } else {
        // Crear el nuevo bus
        // Asumimos que ApiService.crearBus devuelve el objeto del bus creado con su idCarro
        const newBus = await ApiService.crearBus({ 
          ...formData,
          idConductor: parseInt(formData.idConductor)
        });

        // Generar 20 asientos por defecto (5 filas x 4 columnas) para la Planta 1
        const filas = ['A', 'B', 'C', 'D', 'E'];
        const columnas = ['1', '2', '3', '4'];
        
        for (const fila of filas) {
          for (const columna of columnas) {
            const asientoData = {
              piso: 1,
              fila: fila,
              columna: columna,
              descripcion: `Asiento ${fila}${columna}`,
              estado: 'DISPONIBLE',
              idBus: newBus.idCarro // Usar el ID del bus recién creado
            };
            await ApiService.crearAsiento(asientoData);
          }
        }
        // Después de crear el bus y los asientos, cargar los detalles del bus recién creado
        await loadBusDetails(newBus);
      }
      
      await cargarDatos(); // Recargar todos los buses para actualizar la lista
      setShowForm(false);
      setEditingBus(null);
      setFormData({ placa: '', idConductor: '' });
    } catch (error) {
      console.error('Error al guardar bus:', error);
      setError('Error al guardar el bus. Por favor, verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsientoSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  
  try {
      await ApiService.crearAsiento({
        ...asientoForm,
        idBus: selectedBus?.idCarro || 0
      });
      
      if (selectedBus) {
        await loadBusDetails(selectedBus);
      }
      setShowAsientoForm(false);
      setAsientoForm({
        piso: 1,
        fila: '',
        columna: '',
        descripcion: '',
        estado: 'DISPONIBLE',
        idBus: selectedBus?.idCarro || 0
      });
    } catch (error) {
      console.error('Error al guardar asiento:', error);
      setError('Error al guardar el asiento. Por favor, verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      placa: bus.placa,
      idConductor: bus.idConductor.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    // Reemplazar window.confirm con un modal personalizado para cumplir con las directrices
    // Por simplicidad, se mantiene window.confirm en este ejemplo, pero se recomienda cambiarlo.
    if (window.confirm('¿Estás seguro de que quieres eliminar este bus?')) {
      try {
        setLoading(true);
        setError(null);
        await ApiService.eliminarBus(id);
        await cargarDatos();
        if (selectedBus?.idCarro === id) {
          setSelectedBus(null);
        }
      } catch (error) {
        console.error('Error al eliminar bus:', error);
        setError('Error al eliminar el bus. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBus(null);
    setFormData({ placa: '', idConductor: '' });
    setError(null);
  };

  const renderAsiento = (asiento: Asiento, isWindowSide: boolean) => {
    let bgColor = 'bg-gray-200';
    if (asiento.estado === 'OCUPADO') bgColor = 'bg-red-500 text-white';
    else if (asiento.estado === 'RESERVADO') bgColor = 'bg-yellow-500 text-white';
    else if (asiento.estado === 'DISPONIBLE') bgColor = 'bg-green-500 text-white';

    return (
      <div 
        key={`${asiento.piso}-${asiento.fila}${asiento.columna}`}
        className={`${bgColor} p-2 rounded-md text-center text-sm font-medium cursor-pointer hover:opacity-80 relative`}
        title={`${asiento.fila}${asiento.columna} - ${asiento.descripcion}`}
      >
        {asiento.fila}{asiento.columna}
        {isWindowSide && (
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-blue-300 rounded"></div>
        )}
      </div>
    );
  };

  const renderPlanta = (planta: number) => {
    if (!selectedBus?.asientos) return null;
    
    const asientosPlanta = selectedBus.asientos.filter(a => a.piso === planta);
    
    // Organizar asientos por fila
    const filas: {[key: string]: Asiento[]} = {};
    asientosPlanta.forEach(asiento => {
      if (!filas[asiento.fila]) filas[asiento.fila] = [];
      filas[asiento.fila].push(asiento);
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Layers className="mr-2" />
          Planta {planta}
        </h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          {/* Representación del bus */}
          <div className="flex flex-col items-center mb-4">
            {/* Techo */}
            <div className="w-full h-4 bg-gray-400 rounded-t-lg mb-2"></div>
            
            {/* Cuerpo del bus */}
            <div className="flex w-full">
              {/* Lado izquierdo (ventanas) - 2 columnas */}
              <div className="w-2/6 flex flex-col items-end pr-2">
                <div className="w-full h-4 bg-blue-100 mb-1 rounded-l"></div>
                {Object.entries(filas).map(([fila, asientosFila]) => {
                  const asientosIzquierda = asientosFila
                    .filter(a => ['1', '2'].includes(a.columna))
                    .sort((a, b) => a.columna.localeCompare(b.columna));
                  
                  return (
                    <div key={`left-${fila}`} className="w-full flex justify-end space-x-1 mb-1">
                      {asientosIzquierda.map(asiento => renderAsiento(asiento, true))}
                    </div>
                  );
                })}
                <div className="w-full h-4 bg-blue-100 mt-1 rounded-l"></div>
              </div>
              
              {/* Pasillo */}
              <div className="w-2/6 h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                Pasillo
              </div>
              
              {/* Lado derecho (ventanas) - 2 columnas */}
              <div className="w-2/6 flex flex-col items-start pl-2">
                <div className="w-full h-4 bg-blue-100 mb-1 rounded-r"></div>
                {Object.entries(filas).map(([fila, asientosFila]) => {
                  const asientosDerecha = asientosFila
                    .filter(a => ['3', '4'].includes(a.columna))
                    .sort((a, b) => a.columna.localeCompare(b.columna));
                  
                  return (
                    <div key={`right-${fila}`} className="w-full flex justify-start space-x-1 mb-1">
                      {asientosDerecha.map(asiento => renderAsiento(asiento, true))}
                    </div>
                  );
                })}
                <div className="w-full h-4 bg-blue-100 mt-1 rounded-r"></div>
              </div>
            </div>
            
            {/* Piso */}
            <div className="w-full h-4 bg-gray-400 rounded-b-lg mt-2"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Bus className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Buses</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Bus
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placa
              </label>
              <input
                type="text"
                value={formData.placa}
                onChange={(e) => setFormData({...formData, placa: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conductor
              </label>
              <select
                value={formData.idConductor}
                onChange={(e) => setFormData({...formData, idConductor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading}
              >
                <option value="">Seleccionar conductor</option>
                {conductores.map(conductor => (
                  <option key={conductor.idTrabajador} value={conductor.idTrabajador}>
                    {conductor.nombre} {conductor.apellido} - DNI: {conductor.dni}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conductor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && buses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center">
                      Cargando buses...
                    </td>
                  </tr>
                ) : buses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No hay buses registrados
                    </td>
                  </tr>
                ) : (
                  buses.map((bus) => (
                    <tr 
                      key={bus.idCarro} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedBus?.idCarro === bus.idCarro ? 'bg-blue-50' : ''}`}
                      onClick={() => loadBusDetails(bus)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bus.placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bus.conductor ? `${bus.conductor.nombre} ${bus.conductor.apellido}` : 'Sin conductor'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(bus);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(bus.idCarro);
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {selectedBus ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Asientos del Bus: {selectedBus.placa}
                </h2>
                <button
                  onClick={() => {
                    setAsientoForm({
                      piso: 1,
                      fila: '',
                      columna: '',
                      descripcion: '',
                      estado: 'DISPONIBLE',
                      idBus: selectedBus.idCarro
                    });
                    setShowAsientoForm(true);
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm"
                  disabled={loading}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nuevo Asiento
                </button>
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setCurrentFloor(1)}
                  className={`flex items-center px-3 py-1 rounded-lg ${currentFloor === 1 ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                  disabled={loading}
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Planta 1
                </button>
                <button
                  onClick={() => setCurrentFloor(2)}
                  className={`flex items-center px-3 py-1 rounded-lg ${currentFloor === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                  disabled={loading}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Planta 2
                </button>
              </div>

              {loading && !selectedBus.asientos ? (
                <div className="text-center py-4">Cargando asientos...</div>
              ) : renderPlanta(currentFloor)}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Seleccione un bus para ver sus asientos
            </div>
          )}
        </div>
      </div>

      {showAsientoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nuevo Asiento</h2>
            <form onSubmit={handleAsientoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso
                </label>
                <select
                  value={asientoForm.piso}
                  onChange={(e) => setAsientoForm({...asientoForm, piso: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                >
                  <option value="1">Planta 1</option>
                  <option value="2">Planta 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fila (ej. A, B, C)
                </label>
                <input
                  type="text"
                  value={asientoForm.fila}
                  onChange={(e) => setAsientoForm({...asientoForm, fila: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                  maxLength={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Columna (1-4)
                </label>
                <select
                  value={asientoForm.columna}
                  onChange={(e) => setAsientoForm({...asientoForm, columna: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar columna</option>
                  <option value="1">Columna 1 (Ventana izquierda)</option>
                  <option value="2">Columna 2 (Pasillo izquierdo)</option>
                  <option value="3">Columna 3 (Pasillo derecho)</option>
                  <option value="4">Columna 4 (Ventana derecha)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={asientoForm.descripcion}
                  onChange={(e) => setAsientoForm({...asientoForm, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={asientoForm.estado}
                  onChange={(e) => setAsientoForm({...asientoForm, estado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="OCUPADO">Ocupado</option>
                  <option value="RESERVADO">Reservado</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAsientoForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusesManager;
