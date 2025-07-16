import React from 'react';
import { Clock, MapPin, Users, Bus } from 'lucide-react';

interface ViajeCardProps {
  viaje: {
    idRutas: number;
    costo: number;
    horaSalida: string;
    fechaSalida: string;
    rutaDTO: {
      nombre: string;
    };
    busDTO: {
      placa: string;
      asientosDisponibles?: number;
      asientosTotales?: number;
    };
  };
  onSelect: () => void;
}

const ViajeCard: React.FC<ViajeCardProps> = ({ viaje, onSelect }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
        <div className="flex items-center">
          <div className="bg-orange-100 rounded-full p-3 mr-4 hidden sm:block">
            <Bus className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800">{viaje.rutaDTO?.nombre || 'Ruta Regular'}</h4>
            <p className="text-gray-600 text-sm">Placa: {viaje.busDTO?.placa || 'N/A'}</p>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-2xl font-bold text-orange-500">S/. {viaje.costo.toFixed(2)}</div>
          <div className="text-sm text-gray-500">por persona</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <div className="text-gray-600">Hora de salida</div>
            <div className="font-medium">{viaje.horaSalida}</div>
          </div>
        </div>
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <div className="text-gray-600">Fecha</div>
            <div className="font-medium">{new Date(viaje.fechaSalida).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</div>
          </div>
        </div>
        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <div className="font-medium">
              {viaje.busDTO.asientosDisponibles !== undefined && viaje.busDTO.asientosTotales !== undefined ?
                `${viaje.busDTO.asientosDisponibles} de ${viaje.busDTO.asientosTotales} disponibles` :
                'Consultar disponibilidad'}
            </div>
            <div className={`text-sm ${viaje.busDTO.asientosDisponibles === 0 ?
              'text-red-600' :
              'text-green-600'
              }`}>
              {viaje.busDTO.asientosDisponibles === 0 ?
                'AGOTADO' :
                (viaje.busDTO.asientosDisponibles && viaje.busDTO.asientosDisponibles > 0 ?
                  'DISPONIBLE' :
                  'Consultar')
              }
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={onSelect}
        disabled={viaje.busDTO.asientosDisponibles === 0}
        className={`w-full py-3 px-6 rounded-lg transition-colors font-medium ${viaje.busDTO.asientosDisponibles === 0 ?
          'bg-gray-400 text-gray-700 cursor-not-allowed' :
          'bg-orange-500 text-white hover:bg-orange-600'
          }`}
      >
        {viaje.busDTO.asientosDisponibles === 0 ? 'VIAJE COMPLETO' : 'Seleccionar Viaje'}
      </button>
    </div>
  );
};

export default ViajeCard;