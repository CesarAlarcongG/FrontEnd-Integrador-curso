import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight, Bus } from 'lucide-react';
import ApiService from '../services/api';

const DestinationsPage: React.FC = () => {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [agenciasResponse, rutasResponse] = await Promise.all([
        ApiService.obtenerAgencias(),
        ApiService.obtenerRutas()
      ]);
      setAgencias(agenciasResponse);
      setRutas(rutasResponse);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const departamentosUnicos = [...new Set(agencias.map(ag => ag.departamento))];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Cargando destinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Nuestros <span className="text-orange-500">Destinos</span>
        </h1>
        <p className="text-xl text-gray-600">
          Descubre todos los lugares a los que puedes viajar con Perú Bus
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {departamentosUnicos.map(departamento => {
          const agenciasDep = agencias.filter(ag => ag.departamento === departamento);
          return (
            <div key={departamento} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-white mr-3" />
                  <h3 className="text-2xl font-bold text-white">{departamento}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {agenciasDep.map(agencia => (
                    <div key={agencia.idAgencia} className="border-l-4 border-orange-200 pl-4">
                      <h4 className="font-semibold text-gray-800">{agencia.provincia}</h4>
                      <p className="text-sm text-gray-600">{agencia.direccion}</p>
                      <p className="text-xs text-gray-500 mt-1">{agencia.referencia}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Rutas <span className="text-orange-500">Populares</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rutas.map(ruta => (
            <div key={ruta.idRuta} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Bus className="h-6 w-6 text-orange-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800">{ruta.nombre}</h3>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-sm">Ruta disponible</span>
                <ArrowRight className="h-4 w-4 mx-2" />
                <span className="text-sm font-medium text-orange-500">Ver horarios</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinationsPage;