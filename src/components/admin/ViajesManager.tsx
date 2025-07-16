import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import ApiService from '../../services/api'; // Asegúrate de que esta ruta es correcta
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface RutaDTO {
  idRuta: number;
  nombre: string;
}

interface BusDTO {
  idCarro: number;
  placa: string;
}

interface Viaje {
  idRutas: number;
  horaSalida: string;
  fechaSalida: string;
  costo: number;
  idRuta: number;
  idCarro: number | null;
  estado: string;
  rutaDTO?: RutaDTO;
  busDTO?: BusDTO;
}

// ⭐ Definición de los estados del viaje ⭐
const VIAJE_ESTADOS = [
  'Programado',
  'En Sala de Espera / Abordando',
  'A Tiempo',
  'Retrasado',
  'En Ruta',
  'En Parada',
  'Llegada Estimada',
  'Finalizado',
  'Cancelado',
  'Desviado'
];

const ViajesManager: React.FC = () => {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [rutas, setRutas] = useState<RutaDTO[]>([]);
  const [buses, setBuses] = useState<BusDTO[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    horaSalida: '',
    fechaSalida: '', // Esta se actualizará al seleccionar una fecha
    costo: '',
    idRuta: '',
    idCarro: '',
    estado: 'Programado'
  });
  const [filterEstado, setFilterEstado] = useState<string>('Todos');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (editingViaje) {
      // Usamos 'T00:00:00' para que Date siempre interprete el inicio del día
      // Esto ayuda a evitar problemas de zona horaria que puedan desplazar la fecha
      const dateForDatePicker = new Date(editingViaje.fechaSalida + 'T00:00:00');
      setSelectedDate(dateForDatePicker);

      setFormData({
        horaSalida: editingViaje.horaSalida.slice(0, 5),
        fechaSalida: editingViaje.fechaSalida,
        costo: editingViaje.costo.toString(),
        idRuta: editingViaje.idRuta?.toString() || '',
        idCarro: (editingViaje.busDTO?.idCarro || editingViaje.idCarro)?.toString() || '',
        estado: editingViaje.estado
      });
    }
  }, [editingViaje]);

  const cargarDatos = async () => {
    try {
      const [viajesResp, rutasResp, busesResp] = await Promise.all([
        ApiService.obtenerViajes(),
        ApiService.obtenerRutas(),
        ApiService.obtenerBuses()
      ]);
      setViajes(viajesResp);
      setRutas(rutasResp);
      setBuses(busesResp);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const resetForm = () => {
    setFormData({ horaSalida: '', fechaSalida: '', costo: '', idRuta: '', idCarro: '', estado: 'Programado' });
    setSelectedDate(null);
    setEditingViaje(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.horaSalida || !selectedDate || !formData.costo || !formData.idRuta || !formData.idCarro || !formData.estado) {
        throw new Error('Todos los campos son obligatorios');
      }

      // Formateamos la fecha del DatePicker a YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const viajeData = {
        horaSalida: formData.horaSalida,
        fechaSalida: formattedDate,
        costo: parseFloat(formData.costo),
        idRuta: parseInt(formData.idRuta),
        idCarro: parseInt(formData.idCarro),
        estado: formData.estado
      };

      // ⭐ AÑADE ESTE CONSOLE.LOG PARA DEPURAR ⭐
      console.log('Datos enviados para guardar/actualizar viaje:', viajeData);

      if (editingViaje) {
        // Asegúrate de que el idRutas se esté pasando correctamente
        await ApiService.editarViaje(editingViaje.idRutas, viajeData);
        
      } else {
        await ApiService.crearViaje(viajeData);
        
      }

      await cargarDatos();
      resetForm();
    } catch (err) {
      console.error('Error al guardar viaje:', err);
      // Muestra el mensaje de error específico si viene del backend
      alert(err instanceof Error ? err.message : 'Error desconocido al guardar el viaje.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (viaje: Viaje) => {
    setEditingViaje(viaje);
    // Usamos 'T00:00:00' para que Date siempre interprete el inicio del día
    // Esto ayuda a evitar problemas de zona horaria que puedan desplazar la fecha
    const dateForDatePicker = new Date(viaje.fechaSalida + 'T00:00:00');
    setSelectedDate(dateForDatePicker);

    setFormData({
      horaSalida: viaje.horaSalida.slice(0, 5),
      fechaSalida: viaje.fechaSalida,
      costo: viaje.costo.toString(),
      idRuta: viaje.idRuta?.toString() || '',
      idCarro: (viaje.busDTO?.idCarro || viaje.idCarro)?.toString() || '',
      estado: viaje.estado
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este viaje?')) {
      try {
        await ApiService.eliminarViaje(id);
        await cargarDatos();
        alert('Viaje eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar viaje:', err);
        alert('Error al eliminar viaje');
      }
    }
  };

  const filteredViajes = viajes.filter(viaje => {
    if (filterEstado === 'Todos') {
      return true;
    }
    return viaje.estado === filterEstado;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <CalendarIcon className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Viajes</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Viaje
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow flex items-center space-x-2">
        <label htmlFor="filterEstado" className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
        <select
          id="filterEstado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="Todos">Todos</option>
          {VIAJE_ESTADOS.map(estado => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">{editingViaje ? 'Editar Viaje' : 'Nuevo Viaje'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                <input
                  type="time"
                  value={formData.horaSalida}
                  onChange={e => setFormData({ ...formData, horaSalida: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Salida</label>
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholderText="Seleccione una fecha"
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costo}
                onChange={e => setFormData({ ...formData, costo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
              <select
                value={formData.idRuta}
                onChange={e => setFormData({ ...formData, idRuta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="" disabled>Seleccionar ruta</option>
                {rutas.map(ruta => (
                  <option key={ruta.idRuta} value={ruta.idRuta.toString()}>
                    {ruta.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
              <select
                value={formData.idCarro}
                onChange={e => setFormData({ ...formData, idCarro: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="" disabled>Seleccionar bus</option>
                {buses.map(bus => (
                  <option key={bus.idCarro} value={bus.idCarro.toString()}>
                    {bus.placa}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Viaje</label>
              <select
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                {VIAJE_ESTADOS.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
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
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Hora', 'Fecha', 'Costo', 'Ruta', 'Bus', 'Estado', 'Acciones'].map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredViajes.map(viaje => (
              <tr key={viaje.idRutas} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {viaje.horaSalida}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(viaje.fechaSalida + 'T00:00:00').toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  S/ {viaje.costo.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {viaje.rutaDTO?.nombre || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {viaje.busDTO?.placa || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${viaje.estado === 'Programado' ? 'bg-blue-100 text-blue-800' :
                      viaje.estado === 'En Sala de Espera / Abordando' ? 'bg-yellow-100 text-yellow-800' :
                      viaje.estado === 'A Tiempo' ? 'bg-green-100 text-green-800' :
                      viaje.estado === 'Retrasado' ? 'bg-orange-100 text-orange-800' :
                      viaje.estado === 'En Ruta' ? 'bg-purple-100 text-purple-800' :
                      viaje.estado === 'En Parada' ? 'bg-indigo-100 text-indigo-800' :
                      viaje.estado === 'Llegada Estimada' ? 'bg-teal-100 text-teal-800' :
                      viaje.estado === 'Finalizado' ? 'bg-gray-100 text-gray-800' :
                      viaje.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                      viaje.estado === 'Desviado' ? 'bg-red-200 text-red-900' : // Añadido para 'Desviado'
                      'bg-gray-100 text-gray-800' // Default
                    }`}>
                    {viaje.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex space-x-2">
                  <button
                    onClick={() => handleEdit(viaje)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(viaje.idRutas)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViajesManager;