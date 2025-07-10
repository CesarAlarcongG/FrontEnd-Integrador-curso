import React, { useState, useEffect } from 'react';
import { Plus, Edit, Users } from 'lucide-react';
import ApiService from '../../services/api';

const AdministradoresManager: React.FC = () => {
  const [administradores, setAdministradores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: ''
  });

  useEffect(() => {
    cargarAdministradores();
  }, []);

  const cargarAdministradores = async () => {
    try {
      const response = await ApiService.obtenerAdministradores();
      setAdministradores(response);
    } catch (error) {
      console.error('Error al cargar administradores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingAdmin) {
        const dataAEnviar: any = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo
        };

        if (formData.contrasena.trim() !== '') {
          dataAEnviar.contrasena = formData.contrasena;
        }

        await ApiService.editarAdministrador(editingAdmin.idAdministrador, {
          ...dataAEnviar,
          idAdministrador: editingAdmin.idAdministrador
        });
      } else {
        await ApiService.crearAdministrador(formData);
      }

      await cargarAdministradores();
      setShowForm(false);
      setEditingAdmin(null);
      setFormData({ nombre: '', apellido: '', correo: '', contrasena: '' });
    } catch (error: any) {
      console.error('Error al guardar administrador:', error);
      setError('Hubo un problema al guardar el administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      nombre: admin.nombre,
      apellido: admin.apellido,
      correo: admin.correo,
      contrasena: ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAdmin(null);
    setFormData({ nombre: '', apellido: '', correo: '', contrasena: '' });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Administradores</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingAdmin(null);
            setFormData({ nombre: '', apellido: '', correo: '', contrasena: '' });
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Administrador
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}
          </h2>

          {error && (
            <div className="text-red-600 font-medium mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {editingAdmin && <span className="text-gray-500">(opcional)</span>}
              </label>
              <input
                type="password"
                value={formData.contrasena}
                onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required={!editingAdmin}
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
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {administradores.map((admin) => (
              <tr key={admin.idAdministrador}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.apellido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.correo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
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

export default AdministradoresManager;
