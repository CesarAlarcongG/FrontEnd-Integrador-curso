import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, Search } from 'lucide-react';
import ApiService from '../services/api';

interface BookingFormProps {
  onSearch: (searchData: any) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSearch }) => {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [tipoViaje, setTipoViaje] = useState('ida');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarAgencias();
    cargarRutas();
  }, []);

  const cargarAgencias = async () => {
    try {
      const response = await ApiService.obtenerAgencias();
      setAgencias(response);
    } catch (error) {
      console.error('Error al cargar agencias:', error);
    }
  };

  const cargarRutas = async () => {
    try {
      const response = await ApiService.obtenerRutas();
      setRutas(response);
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origen || !destino || !fechaSalida) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Encontrar la ruta que conecta origen y destino
      const rutaEncontrada = rutas.find(ruta => {
        const agenciasRuta = ruta.agencias || [];
        const tieneOrigen = agenciasRuta.some((ag: any) => ag.departamento === origen);
        const tieneDestino = agenciasRuta.some((ag: any) => ag.departamento === destino);
        return tieneOrigen && tieneDestino;
      });

      if (rutaEncontrada) {
        const viajesResponse = await ApiService.buscarViajes({
          fecha: fechaSalida,
          idRuta: rutaEncontrada.idRuta
        });
        
        onSearch({
          origen,
          destino,
          fechaSalida,
          tipoViaje,
          viajes: viajesResponse
        });
      } else {
        alert('No se encontraron rutas para este trayecto');
      }
    } catch (error) {
      console.error('Error al buscar viajes:', error);
      alert('Error al buscar viajes');
    } finally {
      setLoading(false);
    }
  };

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
                setDestino(''); // Reset destino cuando cambia origen
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
              required
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
    </div>
  );
};

export default BookingForm;