import React from 'react';
import { CheckCircle, MapPin, Bus, Armchair, Users, Ticket, Download, Clock } from 'lucide-react';

interface PurchaseSummaryProps {
  purchaseSummary: {
    idViaje: number;
    viaje: {
      rutaDTO: {
        nombre: string;
      };
      fechaSalida: string;
      horaSalida: string;
      busDTO: {
        placa: string;
      };
    };
    pasajeros: Array<{
      dni: string;
      nombres: string;
      apellidos: string;
      edad: string;
    }>;
    asientosSeleccionadosDetalles: Array<{
      descripcion: string;
    }>;
    totalPagar: number;
  };
  onDownloadTicket: () => void;
  onAcknowledge: () => void;
  loading: boolean;
}

const PurchaseSummary: React.FC<PurchaseSummaryProps> = ({ 
  purchaseSummary, 
  onDownloadTicket, 
  onAcknowledge,
  loading 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      <h3 className="text-3xl font-bold text-gray-800 mb-4">¡Compra Exitosa!</h3>
      <p className="text-gray-600 text-lg mb-8">Tu pasaje ha sido registrado con éxito.</p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
        <h4 className="text-xl font-semibold text-gray-700 mb-4">Detalles de tu Compra:</h4>
        <div className="space-y-3">
          <p className="flex items-center text-gray-800"><MapPin className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">Ruta:</span> {purchaseSummary.viaje.rutaDTO.nombre}
          </p>
          <p className="flex items-center text-gray-800"><Clock className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">Fecha y Hora:</span> {new Date(purchaseSummary.viaje.fechaSalida).toLocaleDateString('es-ES', { timeZone: 'UTC' })} a las {purchaseSummary.viaje.horaSalida}
          </p>
          <p className="flex items-center text-gray-800"><Bus className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">Bus:</span> {purchaseSummary.viaje.busDTO.placa}
          </p>
          <p className="flex items-center text-gray-800"><Armchair className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">Asientos:</span> {purchaseSummary.asientosSeleccionadosDetalles.map(a => a.descripcion).join(', ')}
          </p>
          <p className="flex items-center text-gray-800"><Users className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">Pasajeros:</span> {purchaseSummary.pasajeros.map(p => `${p.nombres} ${p.apellidos}`).join(', ')}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-green-200 mt-4">
            <span className="text-xl font-bold text-gray-800 flex items-center">
              <Ticket className="h-6 w-6 mr-2 text-green-700" />
              ID de tu Viaje:
            </span>
            <span className="text-4xl font-extrabold text-green-700 select-all">
              {purchaseSummary.idViaje}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Si deseas consultar el estado de tu viaje, por favor, digita este código en la barra de estado de viaje.
          </p>
          <button
            onClick={onDownloadTicket}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium shadow-lg mt-6"
            disabled={loading}
          >
            <Download className="h-5 w-5 mr-2" />
            {loading ? 'Generando PDF...' : 'Descargar Boleto'}
          </button>
          <div className="flex justify-between items-center pt-4 border-t border-green-200 mt-4">
            <span className="text-xl font-bold text-gray-800">Total Pagado:</span>
            <span className="text-4xl font-extrabold text-green-700">S/. {purchaseSummary.totalPagar.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onAcknowledge}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium shadow-lg"
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        Entendido y muchas gracias por su compra
      </button>
    </div>
  );
};

export default PurchaseSummary;