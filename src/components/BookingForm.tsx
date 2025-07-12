import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, Search, Info, Bus, Clock, Ticket, AlertTriangle } from 'lucide-react'; // ⭐ Added AlertTriangle here ⭐
import ApiService from '../services/api';

interface Agencia {
  idAgencia: number;
  departamento: string;
}

interface Ruta {
  idRuta: number;
  idAgenciaPartida: number;
  idAgenciaDestino: number;
  agenciaPartida?: Agencia;
  agenciaDestino?: Agencia;
  nombre?: string; // Add nombre to Ruta interface
}

// ⭐ Actualizada la interfaz Viaje para incluir 'estado' y 'busDTO'/'rutaDTO' completos ⭐
interface Viaje {
  idRutas: number;
  horaSalida: string;
  fechaSalida: string;
  costo: number;
  idRuta: number;
  idCarro: number | null;
  estado: string; // Nuevo campo estado
  busDTO: { // Detalles del bus
    idCarro: number;
    placa: string;
    idConductor: number | null;
    conductorDTO: any | null;
  } | null;
  rutaDTO: { // Detalles de la ruta
    idRuta: number;
    nombre: string;
    idAdministrador: number | null;
    agenciasIds: any | null;
    agenciaDTOS: any | null;
  } | null;
}

interface BookingFormProps {
  onSearch: (searchData: any) => void;
}

// ⭐ Definición de los estados del viaje para el badge ⭐
const VIAJE_ESTADOS_MAP: { [key: string]: string } = {
  'Programado': 'bg-blue-100 text-blue-800',
  'En Sala de Espera / Abordando': 'bg-yellow-100 text-yellow-800',
  'A Tiempo': 'bg-green-100 text-green-800',
  'Retrasado': 'bg-orange-100 text-orange-800',
  'En Ruta': 'bg-purple-100 text-purple-800',
  'En Parada': 'bg-indigo-100 text-indigo-800',
  'Llegada Estimada': 'bg-teal-100 text-teal-800',
  'Finalizado': 'bg-gray-100 text-gray-800',
  'Cancelado': 'bg-red-100 text-red-800',
  'Desviado': 'bg-pink-100 text-pink-800'
};


const BookingForm: React.FC<BookingFormProps> = ({ onSearch }) => {
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [tipoViaje, setTipoViaje] = useState('ida');
  const [loading, setLoading] = useState(false);

  // ⭐ Nuevos estados para la consulta de estado del viaje ⭐
  const [tripIdInput, setTripIdInput] = useState<string>('');
  const [tripStatusData, setTripStatusData] = useState<Viaje | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [agenciasResp, rutasResp] = await Promise.all([
          ApiService.obtenerAgencias(),
          ApiService.obtenerRutas()
        ]);
        
        const rutasCompletas = rutasResp.map((ruta: any) => ({
          ...ruta,
          agenciaPartida: agenciasResp.find(a => a.idAgencia === ruta.idAgenciaPartida),
          agenciaDestino: agenciasResp.find(a => a.idAgencia === ruta.idAgenciaDestino),
          nombre: `${agenciasResp.find(a => a.idAgencia === ruta.idAgenciaPartida)?.departamento}-${
                      agenciasResp.find(a => a.idAgencia === ruta.idAgenciaDestino)?.departamento}`
        }));

        setAgencias(agenciasResp);
        setRutas(rutasCompletas);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origen || !destino) {
      alert('Por favor completa los campos de Origen, Destino y Fecha de Salida para buscar viajes.');
      return;
    }

    setLoading(true);
    try {
      const nombreRuta = `${origen}-${destino}`;
      
      const viajesResponse = await ApiService.buscarViajes({
        fecha: fechaSalida,
        nombreRuta: nombreRuta
      });
      
      onSearch({
        origen,
        destino,
        fechaSalida,
        tipoViaje,
        viajes: viajesResponse
      });
      // Limpiar el estado de consulta de viaje al realizar una nueva búsqueda de viajes
      setTripStatusData(null);
      setTripIdInput('');
      setStatusError(null);

    } catch (error) {
      console.error('Error al buscar viajes:', error);
      alert('Error al buscar viajes');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Función para manejar la consulta del estado del viaje ⭐
  const handleStatusLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripIdInput) {
      setStatusError('Por favor, ingresa un ID de viaje.');
      setTripStatusData(null);
      return;
    }

    setStatusLoading(true);
    setStatusError(null);
    setTripStatusData(null); // Limpiar datos anteriores

    try {
      const id = parseInt(tripIdInput, 10);
      if (isNaN(id)) {
        throw new Error('El ID de viaje debe ser un número válido.');
      }
      const data = await ApiService.obtenerViajePorId(id);
      setTripStatusData(data);
    } catch (err: any) {
      setStatusError(`No se pudo obtener el estado del viaje: ${err.message || 'Error desconocido'}.`);
      console.error("Error al obtener estado del viaje:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Obtener departamentos únicos para los selectores
  const departamentosDisponibles = [...new Set(agencias.map(ag => ag.departamento))];
  const destinosDisponibles = departamentosDisponibles.filter(dep => dep !== origen);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Busca tu próximo destino
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Origen
            </label>
            <select
              value={origen}
              onChange={(e) => {
                setOrigen(e.target.value);
                setDestino('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Selecciona tu ciudad de origen</option>
              {departamentosDisponibles.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowRight className="inline h-4 w-4 mr-1" />
              Destino
            </label>
            <select
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
              disabled={!origen}
            >
              <option value="">Selecciona tu destino</option>
              {destinosDisponibles.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha de salida
            </label>
            <input
              type="date"
              value={fechaSalida}
              onChange={(e) => setFechaSalida(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de viaje
            </label>
            <select
              value={tipoViaje}
              onChange={(e) => setTipoViaje(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ida">Solo ida</option>
              <option value="ida-vuelta">Ida y vuelta</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center font-medium disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <Search className="h-5 w-5 mr-2" />
          )}
          Buscar Viajes
        </button>
      </form>

      {/* ⭐ Sección para consultar el estado del viaje ⭐ */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Consulta el Estado de tu Viaje
        </h2>
        <form onSubmit={handleStatusLookup} className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Ingresa el ID de tu viaje"
            value={tripIdInput}
            onChange={(e) => {
              setTripIdInput(e.target.value);
              setStatusError(null); // Clear error on input change
              setTripStatusData(null); // Clear previous data
            }}
            className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={statusLoading || !tripIdInput}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center font-medium disabled:opacity-50"
          >
            {statusLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Info className="h-5 w-5 mr-2" />
            )}
            Consultar Estado
          </button>
        </form>

        {statusError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{statusError}</p>
          </div>
        )}

        {tripStatusData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left shadow-md">
            <h4 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <Ticket className="h-6 w-6 mr-3 text-green-600" />
              Estado del Viaje ID: {tripStatusData.idRutas}
            </h4>
            <div className="space-y-3">
              <p className="flex items-center text-gray-800">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Ruta:</span> {tripStatusData.rutaDTO?.nombre || 'N/A'}
              </p>
              <p className="flex items-center text-gray-800">
                <Bus className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Bus:</span> {tripStatusData.busDTO?.placa || 'N/A'}
              </p>
              <p className="flex items-center text-gray-800">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Fecha y Hora:</span> {new Date(tripStatusData.fechaSalida).toLocaleDateString('es-ES', { timeZone: 'UTC' })} a las {tripStatusData.horaSalida}
              </p>
              <div className="flex items-center text-gray-800">
                <Info className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Estado Actual:</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${VIAJE_ESTADOS_MAP[tripStatusData.estado] || 'bg-gray-100 text-gray-800'}`}>
                  {tripStatusData.estado}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* FIN Sección para consultar el estado del viaje */}
    </div>
  );
};

export default BookingForm;
