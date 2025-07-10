import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import ApiService from '../../services/api';

const AsientosManager: React.FC = () => {
  const [asientos, setAsientos] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAsiento, setEditingAsiento] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    piso: '',
    asiento: '',
    precio: '',
    descripcion: '',
    estado: 'DISPONIBLE',
    idBus: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [asientosResponse, busesResponse] = await Promise.all([
        ApiService.obtenerAsientos(),
        ApiService.obtenerBuses()
      ]);
      setAsientos(asientosResponse);
      setBuses(busesResponse);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const asientoData = {
        ...formData,
        piso: parseInt(formData.piso),
        precio: parseFloat(formData.precio),
        idBus: parseInt(formData.idBus)
      };
      
      if (editingAsiento) {
        await ApiService.editarAsiento(editingAsiento.idAsiento, {
          ...asientoData,
          idAsiento: editingAsiento.idAsiento
        });
      } else {
        await ApiService.crearAsiento(asientoData);
      }
      
      await cargarDatos();
      setShowForm(false);
      setEditingAsiento(null);
      setFormData({ piso: '', asiento: '', precio: '', descripcion: '', estado: 'DISPONIBLE', idBus: '' });
    } catch (error) {
      console.error('Error al guardar asiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asiento: any) => {
    setEditingAsiento(asiento);
    setFormData({
      piso: asiento.piso.toString(),
      asiento: asiento.asiento,
      precio: asiento.precio.toString(),
      descripcion: asiento.descripcion,
      estado: asiento.estado,
      idBus: asiento.idBus.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este asiento?')) {
      try {
        await ApiService.eliminarAsiento(id);
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar asiento:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAsiento(null);
    setFormData({ piso: '', asiento: '', precio: '', descripcion: '', estado: 'DISPONIBLE', idBus: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Asientos</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Asiento
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAsiento ? 'Editar Asiento' : 'Nuevo Asiento'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso
                </label>
                <select
                  value={formData.piso}
                  onChange={(e) => setFormData({...formData, piso: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Seleccionar piso</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Asiento
                </label>
                <input
                  type="text"
                  value={formData.asiento}
                  onChange={(e) => setFormData({...formData, asiento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="OCUPADO">Ocupado</option>
                  <option value="RESERVADO">Reservado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus
              </label>
              <select
                value={formData.idBus}
                onChange={(e) => setFormData({...formData, idBus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Seleccionar bus</option>
                {buses.map(bus => (
                  <option key={bus.idBus} value={bus.idBus}>
                    {bus.placa} - {bus.conductor ? `${bus.conductor.nombre} ${bus.conductor.apellido}` : 'Sin conductor'}
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
                Piso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {asientos.map((asiento) => (
              <tr key={asiento.idAsiento}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {asiento.piso}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {asiento.asiento}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  S/. {asiento.precio}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    asiento.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-800' :
                    asiento.estado === 'OCUPADO' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {asiento.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {asiento.idBus}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(asiento)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asiento.idAsiento)}
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

export default AsientosManager;