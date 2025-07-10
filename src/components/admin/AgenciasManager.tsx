import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import ApiService from '../../services/api';

const AgenciasManager: React.FC = () => {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAgencia, setEditingAgencia] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    departamento: '',
    provincia: '',
    direccion: '',
    referencia: ''
  });

  useEffect(() => {
    cargarAgencias();
  }, []);

  const cargarAgencias = async () => {
    try {
      const response = await ApiService.obtenerAgencias();
      setAgencias(response);
    } catch (error) {
      console.error('Error al cargar agencias:', error);
      alert('❌ Error al cargar las agencias.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAgencia) {
        await ApiService.editarAgencia(editingAgencia.idAgencia, {
          ...formData,
          idAgencia: editingAgencia.idAgencia
        });
        alert('✅ Agencia actualizada correctamente.');
      } else {
        await ApiService.crearAgencia(formData);
        alert('✅ Agencia creada correctamente.');
      }

      await cargarAgencias();
      handleCancel(); // limpia y cierra el formulario
    } catch (error) {
      console.error('Error al guardar agencia:', error);
      alert('❌ Error al guardar la agencia.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agencia: any) => {
    setEditingAgencia(agencia);
    setFormData({
      departamento: agencia.departamento,
      provincia: agencia.provincia,
      direccion: agencia.direccion,
      referencia: agencia.referencia
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta agencia?')) {
      try {
        await ApiService.eliminarAgencia(id);
        alert('✅ Agencia eliminada correctamente.');
        await cargarAgencias();
        if (editingAgencia?.idAgencia === id) handleCancel();
      } catch (error) {
        console.error('Error al eliminar agencia:', error);
        alert('❌ Error al eliminar la agencia.');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAgencia(null);
    setFormData({
      departamento: '',
      provincia: '',
      direccion: '',
      referencia: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <MapPin className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Agencias</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Agencia
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAgencia ? 'Editar Agencia' : 'Nueva Agencia'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
              <input
                type="text"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provincia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agencias.map((agencia) => (
              <tr key={agencia.idAgencia}>
                <td className="px-6 py-4 text-sm text-gray-900">{agencia.departamento}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{agencia.provincia}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{agencia.direccion}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{agencia.referencia}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(agencia)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(agencia.idAgencia)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {agencias.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No hay agencias registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgenciasManager;
