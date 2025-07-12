import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Bus, Armchair, UserPlus, X, AlertTriangle, CheckCircle, Ticket } from 'lucide-react'; // Added Ticket icon
import ApiService from '../services/api'; // Asegúrate que la ruta al ApiService sea correcta

// --- INTERFACES PARA TIPADO ---
interface Viaje {
  idRutas: number; // Coincide con "idRutas" en la API
  costo: number;
  horaSalida: string;
  fechaSalida: string;
  // La API devuelve 'rutaDTO' y 'busDTO', no 'ruta' y 'bus' directamente
  rutaDTO: { // CAMBIADO: Ahora es rutaDTO
    idRuta: number;
    nombre: string;
    idAdministrador: number; // Añadido según tu JSON de ejemplo
    agenciasIds: any | null; // Añadido según tu JSON de ejemplo, ajusta el tipo si es conocido
    agenciaDTOS: any | null; // Añadido según tu JSON de ejemplo, ajusta el tipo si es conocido
  };
  busDTO: { // CAMBIADO: Ahora es busDTO
    idCarro: number;
    placa: string;
    idConductor: number | null; // Añadido según tu JSON de ejemplo
    conductorDTO: any | null; // Añadido según tu JSON de ejemplo, ajusta el tipo si es conocido
  };
}

interface Asiento {
  idAsiento: number;
  piso: number;
  descripcion: string; // e.g., "A1", "C3"
  estado: 'disponible' | 'ocupado';
}

interface Pasajero {
  dni: string;
  nombres: string;
  apellidos: string;
  edad: string; // Se maneja como string en el input, se convertirá a número al enviar
}

interface ViajesResultsProps {
  searchData: {
    origen: string;
    destino: string;
    fechaSalida: string;
    viajes: Viaje[];
  };
}

// ⭐ NUEVA INTERFAZ PARA EL RESUMEN DE COMPRA (con idViaje) ⭐
interface PurchaseSummary {
  idViaje: number; // Añadido para mostrar el ID del viaje
  viaje: Viaje;
  pasajeros: Pasajero[];
  asientosSeleccionadosDetalles: Asiento[]; // Detalles completos de los asientos seleccionados
  totalPagar: number;
}

// --- COMPONENTE PRINCIPAL ---
const ViajesResults: React.FC<ViajesResultsProps> = ({ searchData }) => {
  const { origen, destino, fechaSalida, viajes } = searchData;

  // --- ESTADOS ---
  const [selectedViaje, setSelectedViaje] = useState<Viaje | null>(null);
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [selectedAsientos, setSelectedAsientos] = useState<number[]>([]);
  const [pasajeros, setPasajeros] = useState<Pasajero[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseSummary, setPurchaseSummary] = useState<PurchaseSummary | null>(null); // Nuevo estado para el resumen

  // --- EFECTOS ---
  // Carga los asientos cuando se selecciona un viaje
  useEffect(() => {
    if (selectedViaje) {
      const fetchAsientos = async () => {
        setLoading(true);
        setError(null);
        try {
          const asientosData = await ApiService.obtenerAsientosPorBus(selectedViaje.busDTO.idCarro);
          console.log("ID de Bus enviado a la API para asientos:", selectedViaje.busDTO.idCarro);
          console.log("Asientos recibidos de la API:", asientosData);
          console.log("Tipo de datos recibidos:", typeof asientosData);
          if (Array.isArray(asientosData)) {
            console.log("Número de asientos recibidos:", asientosData.length);
          }

          if (Array.isArray(asientosData) && asientosData.every((item: any) =>
            'idAsiento' in item && 'piso' in item && 'descripcion' in item && 'estado' in item
          )) {
            setAsientos(asientosData);
          } else {
            throw new Error("La estructura de datos de los asientos es incorrecta o faltan propiedades clave.");
          }
        } catch (err: any) {
          setError(`No se pudieron cargar los asientos: ${err.message || 'Error desconocido'}.`);
          console.error("Error al cargar asientos:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAsientos();
    }
  }, [selectedViaje]);

  // --- MANEJADORES DE EVENTOS ---
  const handleSelectViaje = (viaje: Viaje) => {
    setSelectedViaje(viaje);
    setPurchaseSummary(null); // Asegurarse de limpiar el resumen si se selecciona un nuevo viaje
  };

  const handleBackToList = () => {
    setSelectedViaje(null);
    setAsientos([]);
    setSelectedAsientos([]);
    setPasajeros([]);
    setError(null);
    setPurchaseSummary(null); // Limpiar el resumen al volver a la lista
  };

  // ⭐ NUEVO MANEJADOR PARA EL BOTÓN "ENTENDIDO" DEL RESUMEN ⭐
  const handleAcknowledgePurchase = () => {
    setPurchaseSummary(null); // Oculta el resumen
    handleBackToList(); // Vuelve a la vista inicial de búsqueda de viajes
  };

  const handleSeatClick = (seatId: number) => {
    setSelectedAsientos(prevSelectedAsientos => {
      const isSelected = prevSelectedAsientos.includes(seatId);
      let newSelectedAsientos;

      if (isSelected) {
        newSelectedAsientos = prevSelectedAsientos.filter(id => id !== seatId);
      } else {
        newSelectedAsientos = [...prevSelectedAsientos, seatId];
      }

      setPasajeros(prevPasajeros => {
        const newPasajeros: Pasajero[] = [];
        newSelectedAsientos.forEach(currentSeatId => {
          const existingPassengerIndex = prevSelectedAsientos.indexOf(currentSeatId);
          if (existingPassengerIndex !== -1 && prevPasajeros[existingPassengerIndex]) {
            newPasajeros.push(prevPasajeros[existingPassengerIndex]);
          } else {
            newPasajeros.push({ dni: '', nombres: '', apellidos: '', edad: '' });
          }
        });
        return newPasajeros;
      });

      return newSelectedAsientos;
    });
  };

  const handlePassengerChange = (index: number, field: keyof Pasajero, value: string) => {
    console.log(`Input change: Pasajero ${index}, Campo: ${field}, Valor: '${value}'`);

    setPasajeros(prevPasajeros => {
      const updatedPasajeros = [...prevPasajeros];
      if (!updatedPasajeros[index]) {
        updatedPasajeros[index] = { dni: '', nombres: '', apellidos: '', edad: '' };
      }
      updatedPasajeros[index][field] = value;
      return updatedPasajeros;
    });
  };

  const handleComprarPasajes = async () => {
    if (!selectedViaje) return;

    if (pasajeros.some(p => !p.dni || !p.nombres || !p.apellidos || !p.edad)) {
      setError('Por favor, complete los datos de todos los pasajeros.');
      return;
    }
    setError(null);
    setLoading(true);

    const payload = {
      totalPagar: selectedViaje.costo * selectedAsientos.length,
      usuarioDTOS: pasajeros.map(p => ({
        ...p,
        edad: parseInt(p.edad, 10),
        permisos: 'CLIENTE',
      })),
      idRuta: selectedViaje.rutaDTO.idRuta,
      idViaje: selectedViaje.idRutas,
      asientosIds: selectedAsientos,
    };

    console.log("Payload enviado a la API de pasajes:", payload);

    try {
      await ApiService.crearPasaje(payload);
      // alert('¡Compra exitosa! Su pasaje ha sido registrado.'); // Eliminamos el alert

      // ⭐ ESTABLECEMOS EL RESUMEN DE COMPRA, incluyendo el idViaje ⭐
      const asientosSeleccionadosDetalles = selectedAsientos.map(seatId =>
        asientos.find(a => a.idAsiento === seatId)
      ).filter((seat): seat is Asiento => seat !== undefined); // Filtrar undefined para tipado

      setPurchaseSummary({
        idViaje: selectedViaje.idRutas, // Guardamos el ID del viaje aquí
        viaje: selectedViaje,
        pasajeros: pasajeros,
        asientosSeleccionadosDetalles: asientosSeleccionadosDetalles,
        totalPagar: selectedViaje.costo * selectedAsientos.length,
      });

      // No llamamos a handleBackToList aquí, ya que queremos mostrar el resumen
    } catch (err) {
      setError('Ocurrió un error al procesar la compra. Verifique los datos o inténtelo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO DE COMPONENTES HIJOS ---
  const renderAsientosDelBus = () => {
    if (loading) {
      return <p className="text-center text-gray-500">Cargando asientos...</p>;
    }

    if (error && error.includes('asientos')) {
      return (
        <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">Error al cargar asientos:</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm">Por favor, intente de nuevo más tarde o contacte a soporte.</p>
        </div>
      );
    }

    if (asientos.length === 0) {
      return (
        <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">No se encontraron asientos disponibles.</p>
          <p className="text-sm">Es posible que todos los asientos estén ocupados o que no haya asientos configurados para este bus.</p>
        </div>
      );
    }

    const pisosDisponibles = [...new Set(asientos.map(a => a.piso))].sort((a, b) => a - b);

    return pisosDisponibles.map(piso => {
      const asientosPiso = asientos.filter(a => a.piso === piso);
      return (
        <div key={piso} className="mb-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Piso {piso}</h4>
          <div className="grid grid-cols-5 gap-3">
            {asientosPiso.map(seat => {
              const isSelected = selectedAsientos.includes(seat.idAsiento);
              const isOcupado = seat.estado === 'ocupado';

              let seatClass = 'cursor-pointer bg-green-100 text-green-800 hover:bg-green-200';
              if (isOcupado) seatClass = 'cursor-not-allowed bg-gray-200 text-gray-500 line-through';
              if (isSelected) seatClass = 'cursor-pointer bg-orange-500 text-white ring-2 ring-orange-600';

              return (
                <button
                  key={seat.idAsiento}
                  disabled={isOcupado}
                  onClick={() => handleSeatClick(seat.idAsiento)}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${seatClass}`}
                >
                  <Armchair className="h-6 w-6" />
                  <span className="text-xs font-bold mt-1">{seat.descripcion}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  };

  // --- VISTA DE RESUMEN DE COMPRA ⭐ NUEVA VISTA ⭐ ---
  if (purchaseSummary) {
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
            {/* ⭐ NUEVA SECCIÓN: ID del Viaje ⭐ */}
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
              Si deseas consultar el estado de tu viaje, por favor, digita este código en la página principal.
            </p>
            {/* FIN NUEVA SECCIÓN */}
            <div className="flex justify-between items-center pt-4 border-t border-green-200 mt-4">
              <span className="text-xl font-bold text-gray-800">Total Pagado:</span>
              <span className="text-4xl font-extrabold text-green-700">S/. {purchaseSummary.totalPagar.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleAcknowledgePurchase}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium shadow-lg"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Entendido y muchas gracias por su compra
        </button>
      </div>
    );
  }

  // --- VISTA DE SELECCIÓN DE ASIENTOS Y PASAJEROS ---
  if (selectedViaje) {
    const isPurchaseDisabled = pasajeros.length === 0 || pasajeros.some(p => !p.dni || !p.nombres || !p.apellidos || !p.edad) || loading;

    console.log("Estado de isPurchaseDisabled:", isPurchaseDisabled);
    console.log("Pasajeros seleccionados:", pasajeros);
    if (pasajeros.some(p => !p.dni || !p.nombres || !p.apellidos || !p.edad)) {
        console.log("Al menos un pasajero tiene datos incompletos.");
        pasajeros.forEach((p, i) => {
            if (!p.dni) console.log(`Pasajero ${i}: DNI está vacío.`);
            if (!p.nombres) console.log(`Pasajero ${i}: Nombres está vacío.`);
            if (!p.apellidos) console.log(`Pasajero ${i}: Apellidos está vacío.`);
            if (!p.edad) console.log(`Pasajero ${i}: Edad está vacío.`);
        });
    }
    console.log("Estado de carga (loading):", loading);


    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Selecciona tus Asientos</h3>
          <button onClick={handleBackToList} className="text-gray-500 hover:text-gray-800"><X className="h-6 w-6" /></button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h4 className="text-xl font-bold mb-4">Mapa del Bus</h4>
            {renderAsientosDelBus()}
          </div>
          <div className="lg:col-span-2">
            {selectedAsientos.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                <div className="text-center text-gray-500">
                  <Armchair className="h-12 w-12 mx-auto mb-4" /><p className="font-semibold">Selecciona uno o más asientos en el mapa.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-6"><UserPlus className="h-6 w-6 text-orange-500 mr-3" /><h4 className="text-xl font-bold">Datos de los Pasajeros</h4></div>
                <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                  {selectedAsientos.map((seatId, index) => {
                    const seat = asientos.find(a => a.idAsiento === seatId);
                    return (
                      <div key={seatId} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-bold text-gray-800 mb-3">Pasajero para el Asiento {seat?.descripcion}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="text" placeholder="DNI" value={pasajeros[index]?.dni || ''} onChange={e => handlePassengerChange(index, 'dni', e.target.value)} className="w-full p-2 border rounded" />
                          <input type="text" placeholder="Nombres" value={pasajeros[index]?.nombres || ''} onChange={e => handlePassengerChange(index, 'nombres', e.target.value)} className="w-full p-2 border rounded" />
                          <input type="text" placeholder="Apellidos" value={pasajeros[index]?.apellidos || ''} onChange={e => handlePassengerChange(index, 'apellidos', e.target.value)} className="w-full p-2 border rounded" />
                          <input type="number" placeholder="Edad" value={pasajeros[index]?.edad || ''} onChange={e => handlePassengerChange(index, 'edad', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-orange-50 border-t-2 border-orange-200 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-800">Total a Pagar:</span>
                    <span className="text-3xl font-bold text-orange-600">S/. {(selectedViaje.costo * selectedAsientos.length).toFixed(2)}</span>
                  </div>
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  <button onClick={handleComprarPasajes} disabled={isPurchaseDisabled} className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {loading ? 'Procesando...' : `Comprar ${selectedAsientos.length} Pasaje(s)`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE LISTA DE VIAJES (INICIAL) ---
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Viajes disponibles</h3>
        <div className="flex flex-wrap items-center text-gray-600 text-sm gap-x-2">
          <MapPin className="h-4 w-4" /><span>{origen} → {destino}</span><span className="hidden md:inline">•</span>
          <span>{new Date(fechaSalida).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</span>
        </div>
      </div>
      {!viajes || viajes.length === 0 ? (
        <div className="text-center py-10"><Bus className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" /><h3 className="text-xl font-semibold mb-2 text-gray-700">No se encontraron viajes</h3><p className="text-gray-500">No hay viajes disponibles para la ruta y fecha seleccionada.</p></div>
      ) : (
        <div className="space-y-4">
          {viajes.map((viaje: Viaje) => (
            <div key={viaje.idRutas} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex items-center"><div className="bg-orange-100 rounded-full p-3 mr-4 hidden sm:block"><Bus className="h-6 w-6 text-orange-500" /></div><div><h4 className="text-lg font-semibold text-gray-800">{viaje.rutaDTO?.nombre || 'Ruta Regular'}</h4><p className="text-gray-600 text-sm">Placa: {viaje.busDTO?.placa || 'N/A'}</p></div></div>
                <div className="text-left sm:text-right w-full sm:w-auto"><div className="text-2xl font-bold text-orange-500">S/. {viaje.costo.toFixed(2)}</div><div className="text-sm text-gray-500">por persona</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="flex items-center"><Clock className="h-5 w-5 text-gray-400 mr-2" /><div><div className="text-gray-600">Hora de salida</div><div className="font-medium">{viaje.horaSalida}</div></div></div>
                <div className="flex items-center"><MapPin className="h-5 w-5 text-gray-400 mr-2" /><div><div className="text-gray-600">Fecha</div><div className="font-medium">{new Date(viaje.fechaSalida).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</div></div></div>
                <div className="flex items-center"><Users className="h-5 w-5 text-gray-400 mr-2" /><div><div className="font-medium text-green-600">Asientos</div><div className="font-medium text-green-600">Disponibles</div></div></div>
              </div>
              <button onClick={() => handleSelectViaje(viaje)} className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-medium">Seleccionar Viaje</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViajesResults;
