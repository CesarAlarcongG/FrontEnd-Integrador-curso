import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Route,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import ApiService from '../../services/api';

const RutasManager: React.FC = () => {
  const [rutas, setRutas] = useState<any[]>([]);
  const [agencias, setAgencias] = useState<any[]>([]);
  const [administradores, setAdministradores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedRutaId, setExpandedRutaId] = useState<number | null>(null);
  const [rutaEditandoId, setRutaEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    idAdministrador: '',
    agenciasSeleccionadas: [] as any[],
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [rutasResp, agenciasResp, adminResp] = await Promise.all([
        ApiService.obtenerRutas(),
        ApiService.obtenerAgencias(),
        ApiService.obtenerAdministradores(),
      ]);
      setRutas(rutasResp);
      setAgencias(agenciasResp);
      setAdministradores(adminResp);
    } catch (e) {
      console.error('Error al cargar datos:', e);
    }
  };

  const getJSONParaEnviar = () => ({
    nombre: formData.nombre,
    idAdministrador: parseInt(formData.idAdministrador),
    agenciasIds: formData.agenciasSeleccionadas.map((ag) => ag.idAgencia),
    ordenAgencias: formData.agenciasSeleccionadas.map((ag) => ag.idAgencia),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = getJSONParaEnviar();
      if (rutaEditandoId) {
        await ApiService.editarRuta(rutaEditandoId, data);
      } else {
        await ApiService.crearRuta(data);
      }
      await cargarDatos();
      closeForm();
    } catch (e) {
      console.error('Error al guardar ruta:', e);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setRutaEditandoId(null);
    setFormData({
      nombre: '',
      idAdministrador: '',
      agenciasSeleccionadas: [],
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Seguro quieres eliminar esta ruta?')) {
      try {
        await ApiService.eliminarRuta(id);
        await cargarDatos();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const prepararEdicion = (ruta: any) => {
    setFormData({
      nombre: ruta.nombre,
      idAdministrador: ruta.idAdministrador.toString(),
      agenciasSeleccionadas: [...ruta.agenciaDTOS].sort(
        (a: any, b: any) => a.orden - b.orden
      ),
    });
    setRutaEditandoId(ruta.idRuta);
    setShowForm(true);
  };

  const moverAgencia = (i: number, dir: 'arriba' | 'abajo') => {
    const arr = [...formData.agenciasSeleccionadas];
    if (dir === 'arriba' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    if (dir === 'abajo' && i < arr.length - 1)
      [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    setFormData({ ...formData, agenciasSeleccionadas: arr });
  };

  const toggleAgenciaSeleccionada = (ag: any) => {
    const exists = formData.agenciasSeleccionadas.some(
      (a) => a.idAgencia === ag.idAgencia
    );
    const arr = exists
      ? formData.agenciasSeleccionadas.filter(
          (a) => a.idAgencia !== ag.idAgencia
        )
      : [...formData.agenciasSeleccionadas, ag];
    setFormData({ ...formData, agenciasSeleccionadas: arr });
  };

  const toggleExpandedRuta = (id: number) => {
    setExpandedRutaId(expandedRutaId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Route className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Rutas</h1>
        </div>
        <button
          onClick={() => {
            closeForm();
            setShowForm(true);
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ruta
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Administrador
            </label>
            <select
              value={formData.idAdministrador}
              onChange={(e) =>
                setFormData({ ...formData, idAdministrador: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Selecciona...</option>
              {administradores.map((admin) => (
                <option
                  key={admin.idAdministrador}
                  value={admin.idAdministrador}
                >
                  {admin.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agencias (ordenadas)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border p-2 rounded-lg bg-gray-50">
              {formData.agenciasSeleccionadas.map((ag, i) => (
                <div
                  key={ag.idAgencia}
                  className="flex justify-between bg-white p-2 border rounded"
                >
                  <span>
                    #{i + 1} - {ag.departamento}, {ag.provincia}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => moverAgencia(i, 'arriba')}
                    >
                      <ArrowUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverAgencia(i, 'abajo')}
                    >
                      <ArrowDown />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <label className="block mt-4 text-sm font-medium text-gray-700 mb-1">
              Seleccionar Agencias
            </label>
            <div className="grid grid-cols-2 gap-2">
              {agencias.map((ag) => (
                <label
                  key={ag.idAgencia}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.agenciasSeleccionadas.some(
                      (a) => a.idAgencia === ag.idAgencia
                    )}
                    onChange={() => toggleAgenciaSeleccionada(ag)}
                  />
                  <span>
                    {ag.departamento}, {ag.provincia}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-gray-50 border rounded p-4">
            <h4 className="font-semibold">JSON a enviar</h4>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(getJSONParaEnviar(), null, 2)}
            </pre>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeForm}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading
                ? 'Guardando...'
                : rutaEditandoId
                ? 'Actualizar Ruta'
                : 'Guardar Ruta'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Administrador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Agencias
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rutas.map((ruta) => (
              <React.Fragment key={ruta.idRuta}>
                <tr>
                  <td className="px-6 py-4 text-sm">{ruta.nombre}</td>
                  <td className="px-6 py-4 text-sm">{ruta.idAdministrador}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      className="text-blue-600 hover:underline flex items-center space-x-1"
                      onClick={() => toggleExpandedRuta(ruta.idRuta)}
                    >
                      <span>Ver agencias</span>
                      {expandedRutaId === ruta.idRuta ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => prepararEdicion(ruta)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ruta.idRuta)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedRutaId === ruta.idRuta && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 bg-gray-50">
                      <div>
                        <h3 className="font-semibold">Itinerario:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                          {ruta.agenciaDTOS
                            .sort((a: any, b: any) => a.orden - b.orden)
                            .map((ag: any, idx: number, arr: any[]) => {
                              const inicio = idx === 0;
                              const destino = idx === arr.length - 1;
                              return (
                                <div
                                  key={ag.idAgencia}
                                  className={`border rounded p-4 shadow-sm ${
                                    inicio
                                      ? 'border-green-500 bg-green-50'
                                      : destino
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="text-xs text-gray-500 mb-1">
                                    #{idx + 1}
                                  </div>
                                  <div className="font-semibold">
                                    {ag.departamento}, {ag.provincia}
                                  </div>
                                  <div className="text-sm">{ag.direccion}</div>
                                  <div className="text-xs italic">
                                    {ag.referencia}
                                  </div>
                                  {inicio && (
                                    <div className="mt-2 text-xs text-green-700">
                                      Punto de partida
                                    </div>
                                  )}
                                  {destino && (
                                    <div className="mt-2 text-xs text-red-700">
                                      Destino
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RutasManager;
