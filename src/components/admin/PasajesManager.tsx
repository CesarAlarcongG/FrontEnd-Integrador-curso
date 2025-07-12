import React, { useState, useEffect } from 'react';
import { Calendar, Eye, AlertCircle } from 'lucide-react';
import ApiService from '../../services/api';

// --- Interfaces para tipar los datos de la API ---
interface UsuarioDTO {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  // Agrega otros campos del DTO de Usuario si los necesitas
}

interface Pasaje {
  idPasaje: number;
  totalPagar: number;
  usuarioDTOS: UsuarioDTO[];
  idRuta: number;
  idViaje: number;
  asientosIds: number[];
}

const PasajesManager: React.FC = () => {
  // Usamos la interfaz Pasaje para tipar el estado
  const [pasajes, setPasajes] = useState<Pasaje[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarPasajes = async () => {
      setLoading(true);
      try {
        const response = await ApiService.obtenerPasajes();
        // Aseguramos que la respuesta sea un array antes de setear el estado
        if (Array.isArray(response)) {
          setPasajes(response);
        } else {
          console.error('La respuesta de la API no es un array:', response);
          setPasajes([]); // Setea un array vacío en caso de error
        }
      } catch (error) {
        console.error('Error al cargar pasajes:', error);
        setPasajes([]); // Limpia los pasajes en caso de error en la petición
      } finally {
        setLoading(false);
      }
    };

    cargarPasajes();
  }, []);

  const formatUserNames = (usuarios: UsuarioDTO[]): string => {
    if (!usuarios || usuarios.length === 0) return 'N/A';
    // Mapea la lista de usuarios y los une con una coma
    return usuarios.map(u => `${u.nombres} ${u.apellidos}`).join(', ');
  };

  const formatSeatIds = (seatIds: number[]): string => {
    if (!seatIds || seatIds.length === 0) return 'N/A';
    // Mapea la lista de IDs de asiento y los une con una coma
    return seatIds.join(', ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Pasajes</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pasaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuarios</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Viaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asientos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pasajes.length > 0 ? (
                pasajes.map((pasaje) => (
                  <tr key={pasaje.idPasaje} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pasaje.idPasaje}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">S/. {pasaje.totalPagar?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatUserNames(pasaje.usuarioDTOS)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pasaje.idViaje}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatSeatIds(pasaje.asientosIds)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button className="text-blue-600 hover:text-blue-800 p-1" title="Ver detalles (funcionalidad futura)">
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <AlertCircle className="h-10 w-10 mb-2" />
                      <p className="font-semibold">No se encontraron pasajes.</p>
                      <p className="text-sm">Actualmente no hay datos de pasajes para mostrar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PasajesManager;