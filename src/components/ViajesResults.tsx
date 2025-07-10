import React from 'react';
import { Clock, MapPin, DollarSign, Users, Bus } from 'lucide-react';

interface ViajesResultsProps {
  searchData: any;
}

const ViajesResults: React.FC<ViajesResultsProps> = ({ searchData }) => {
  const { origen, destino, fechaSalida, viajes } = searchData;

  if (!viajes || viajes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-gray-500 mb-4">
          <Bus className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No se encontraron viajes</h3>
          <p>No hay viajes disponibles para la fecha seleccionada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Viajes disponibles
        </h3>
        <div className="flex items-center text-gray-600 text-sm">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{origen} → {destino}</span>
          <span className="mx-2">•</span>
          <span>{new Date(fechaSalida).toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      <div className="space-y-4">
        {viajes.map((viaje: any) => (
          <div key={viaje.idViaje} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-3 mr-4">
                  <Bus className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    {viaje.ruta?.nombre || 'Ruta Regular'}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Placa: {viaje.bus?.placa || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-500">
                  S/. {viaje.costo}
                </div>
                <div className="text-sm text-gray-500">por persona</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Hora de salida</div>
                  <div className="font-medium">{viaje.horaSalida}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Fecha</div>
                  <div className="font-medium">
                    {new Date(viaje.fechaSalida).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Asientos</div>
                  <div className="font-medium text-green-600">Disponibles</div>
                </div>
              </div>
            </div>

            <button className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Seleccionar Viaje
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViajesResults;