import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bus } from 'lucide-react';
import ApiService from '../../services/api';

const BusesManager: React.FC = () => {
  const [buses, setBuses] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    idConductor: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [busesResponse, conductoresResponse] = await Promise.all([
        ApiService.obtenerBuses(),
        ApiService.obtenerConductores()
      ]);
      setBuses(busesResponse);
      setConductores(conductoresResponse);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingBus) {
        await ApiService.editarBus(editingBus.idBus, {
          ...formData,
          idConductor: parseInt(formData.idConductor)
        });
      } else {
        await ApiService.crearBus({
          ...formData,
          idConductor: parseInt(formData.idConductor)
        });
      }
      
      await cargarDatos();
      setShowForm(false);
      setEditingBus(null);
      setFormData({ placa: '', idConductor: '' });
    } catch (error) {
      console.error('Error al guardar bus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus: any) => {
    setEditingBus(bus);
    setFormData({
      placa: bus.placa,
      idConductor: bus.idConductor.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este bus?')) {
      try {
        await ApiService.eliminarBus(id);
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar bus:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBus(null);
    setFormData({ placa: '', idConductor: '' });
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
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Bus
        </button>
      </div>

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
            {buses.map((bus) => (
              <tr key={bus.idBus}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bus.placa}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bus.conductor ? `${bus.conductor.nombre} ${bus.conductor.apellido}` : 'Sin conductor'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(bus)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bus.idBus)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusesManager;