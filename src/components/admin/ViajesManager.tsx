import React, { useState, useEffect } from 'react';
import { Plus, Edit, Calendar } from 'lucide-react';
import ApiService from '../../services/api';

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
  idCarro: number;
  rutaDTO?: RutaDTO;
  busDTO?: BusDTO;
}

const ViajesManager: React.FC = () => {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [rutas, setRutas] = useState<RutaDTO[]>([]);
  const [buses, setBuses] = useState<BusDTO[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    horaSalida: '',
    fechaSalida: '',
    costo: '',
    idRuta: '',
    idCarro: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

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
    setFormData({ horaSalida: '', fechaSalida: '', costo: '', idRuta: '', idCarro: '' });
    setEditingViaje(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.horaSalida || !formData.fechaSalida || !formData.costo || !formData.idRuta || !formData.idCarro) {
        throw new Error('Todos los campos son obligatorios');
      }

      const viajeData = {
        horaSalida: formData.horaSalida,
        fechaSalida: formData.fechaSalida,
        costo: parseFloat(formData.costo),
        idRuta: parseInt(formData.idRuta),
        idCarro: parseInt(formData.idCarro)
      };

      if (editingViaje) {
        await ApiService.editarViaje(editingViaje.idRutas, viajeData);
      } else {
        await ApiService.crearViaje(viajeData);
      }

      await cargarDatos();
      resetForm();
    } catch (err) {
      console.error('Error al guardar viaje:', err);
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (viaje: Viaje) => {
    setEditingViaje(viaje);
    setFormData({
      horaSalida: viaje.horaSalida.slice(0, 5),
      fechaSalida: viaje.fechaSalida,
      costo: viaje.costo.toString(),
      idRuta: viaje.idRuta?.toString() || '',
      idCarro: viaje.idCarro?.toString() || ''
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-orange-500 mr-2" />
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

      {showForm && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">{editingViaje ? 'Editar Viaje' : 'Nuevo Viaje'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Hora de Salida</label>
                <input
                  type="time"
                  value={formData.horaSalida}
                  onChange={e => setFormData({ ...formData, horaSalida: e.target.value })}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Fecha de Salida</label>
                <input
                  type="date"
                  value={formData.fechaSalida}
                  onChange={e => setFormData({ ...formData, fechaSalida: e.target.value })}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Costo</label>
              <input
                type="number"
                step="0.01"
                value={formData.costo}
                onChange={e => setFormData({ ...formData, costo: e.target.value })}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Ruta</label>
              <select
                value={formData.idRuta}
                onChange={e => setFormData({ ...formData, idRuta: e.target.value })}
                className="w-full border p-2 rounded"
                required
              >
                <option value="" disabled>Seleccionar ruta</option>
                {rutas.map(ruta => (
                  <option key={ruta.idRuta} value={ruta.idRuta}>{ruta.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Bus</label>
              <select
                value={formData.idCarro}
                onChange={e => setFormData({ ...formData, idCarro: e.target.value })}
                className="w-full border p-2 rounded"
                required
              >
                <option value="" disabled>Seleccionar bus</option>
                {buses.map(bus => (
                  <option key={bus.idCarro} value={bus.idCarro}>
                    {bus.placa}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Hora', 'Fecha', 'Costo', 'Ruta', 'Bus', 'Acciones'].map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {viajes.map(viaje => (
              <tr key={viaje.idRutas}>
                <td className="px-6 py-4">{viaje.horaSalida}</td>
                <td className="px-6 py-4">{new Date(viaje.fechaSalida).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4">S/ {viaje.costo.toFixed(2)}</td>
                <td className="px-6 py-4">{viaje.rutaDTO?.nombre || 'N/A'}</td>
                <td className="px-6 py-4">{viaje.busDTO?.placa || 'N/A'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleEdit(viaje)} className="text-blue-600 hover:text-blue-800">
                    <Edit className="h-4 w-4" />
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
