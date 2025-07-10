import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import ApiService from '../../services/api';

const ConductoresManager: React.FC = () => {
  const [conductores, setConductores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConductor, setEditingConductor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    numeroLicenciaConduccion: ''
  });

  useEffect(() => {
    cargarConductores();
  }, []);

  const cargarConductores = async () => {
    try {
      const response = await ApiService.obtenerConductores();
      setConductores(response);
    } catch (error) {
      console.error('Error al cargar conductores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingConductor) {
        await ApiService.editarConductor(editingConductor.idTrabajador, {
          ...formData,
          idTrabajador: editingConductor.idTrabajador
        });
      } else {
        await ApiService.crearConductor(formData);
      }
      
      await cargarConductores();
      setShowForm(false);
      setEditingConductor(null);
      setFormData({ nombre: '', apellido: '', dni: '', numeroLicenciaConduccion: '' });
    } catch (error) {
      console.error('Error al guardar conductor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conductor: any) => {
    setEditingConductor(conductor);
    setFormData({
      nombre: conductor.nombre,
      apellido: conductor.apellido,
      dni: conductor.dni,
      numeroLicenciaConduccion: conductor.numeroLicenciaConduccion
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor?')) {
      try {
        await ApiService.eliminarConductor(id);
        await cargarConductores();
      } catch (error) {
        console.error('Error al eliminar conductor:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConductor(null);
    setFormData({ nombre: '', apellido: '', dni: '', numeroLicenciaConduccion: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <UserCheck className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Conductores</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Conductor
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Licencia
              </label>
              <input
                type="text"
                value={formData.numeroLicenciaConduccion}
                onChange={(e) => setFormData({...formData, numeroLicenciaConduccion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
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
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apellido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Licencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conductores.map((conductor) => (
              <tr key={conductor.idTrabajador}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conductor.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conductor.apellido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conductor.dni}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conductor.numeroLicenciaConduccion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(conductor)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(conductor.idTrabajador)}
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

export default ConductoresManager;