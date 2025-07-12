import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Bus, Armchair, UserPlus, X, AlertTriangle, CheckCircle, Layers, Ticket, Download } from 'lucide-react'; // Added Download icon
import ApiService from '../services/api'; // Asegúrate que la ruta al ApiService sea correcta
import html2canvas from 'html2canvas'; // Importar html2canvas
import jsPDF from 'jspdf'; // Importar jsPDF

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
  fila: string; // Ej: "A", "B"
  columna: string; // Ej: "1", "2", "3", "4"
  descripcion: string; // e.g., "A1", "C3"
  estado: 'disponible' | 'ocupado'; // Asumiendo estos estados
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

// ⭐ NUEVA INTERFAZ PARA EL RESUMEN DE COMPRA ⭐
interface PurchaseSummary {
  idViaje: number; // Added to display the trip ID
  viaje: Viaje;
  pasajeros: Pasajero[];
  asientosSeleccionadosDetalles: Asiento[]; // Detalles completos de los asientos seleccionados
  totalPagar: number;
  ticketDownloadUrl?: string; // ⭐ Added for ticket download ⭐
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
  const [purchaseSummary, setPurchaseSummary] = useState<PurchaseSummary | null>(null); // New state for the summary

  // --- EFECTOS ---
  // Loads seats when a trip is selected
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
            'idAsiento' in item && 'piso' in item && 'descripcion' in item && 'estado' in item && 'fila' in item && 'columna' in item // Ensure to have row and column
          )) {
            setAsientos(asientosData);
          } else {
            throw new Error("La estructura de datos de los asientos es incorrecta o faltan propiedades clave (idAsiento, piso, descripcion, estado, fila, columna).");
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

  // --- EVENT HANDLERS ---
  const handleSelectViaje = (viaje: Viaje) => {
    setSelectedViaje(viaje);
    setPurchaseSummary(null); // Ensure to clear the summary if a new trip is selected
    setSelectedAsientos([]); // Clear selected seats when changing trips
    setPasajeros([]); // Clear passengers when changing trips
  };

  const handleBackToList = () => {
    setSelectedViaje(null);
    setAsientos([]);
    setSelectedAsientos([]);
    setPasajeros([]);
    setError(null);
    setPurchaseSummary(null); // Clear the summary when returning to the list
  };

  // ⭐ NEW HANDLER FOR THE "GOT IT" BUTTON IN THE SUMMARY ⭐
  const handleAcknowledgePurchase = () => {
    setPurchaseSummary(null); // Hides the summary
    handleBackToList(); // Returns to the initial trip search view
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
          // Try to keep passenger data if the seat was already selected
          const existingPassengerIndex = prevSelectedAsientos.indexOf(currentSeatId);
          if (isSelected && existingPassengerIndex !== -1 && prevPasajeros[existingPassengerIndex]) {
            // If the seat was already selected and is deselected, we don't add it to newPasajeros
            // This is handled by the filter of newSelectedAsientos
          } else if (!isSelected && !prevSelectedAsientos.includes(currentSeatId)) {
            // If it's a newly selected seat, add an empty passenger
            newPasajeros.push({ dni: '', nombres: '', apellidos: '', edad: '' });
          } else {
            // If the seat was already selected and remains selected, copy existing data
            const currentPassenger = prevPasajeros.find((_, idx) => prevSelectedAsientos[idx] === currentSeatId);
            newPasajeros.push(currentPassenger || { dni: '', nombres: '', apellidos: '', edad: '' });
          }
        });

        // Ensure the number of passengers matches the number of selected seats
        // And that passenger data remains associated with their seats
        const finalPasajeros = newSelectedAsientos.map(seatId => {
          const existingPassenger = prevPasajeros.find((_, index) => prevSelectedAsientos[index] === seatId);
          return existingPassenger || { dni: '', nombres: '', apellidos: '', edad: '' };
        });

        return finalPasajeros;
      });

      return newSelectedAsientos;
    });
  };


  const handlePassengerChange = (index: number, field: keyof Pasajero, value: string) => {
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

    if (selectedAsientos.length === 0) {
      setError('Por favor, selecciona al menos un asiento.');
      return;
    }

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
      const pasajeResponse = await ApiService.crearPasaje(payload); // Assuming this returns an object with idPasaje or similar
      console.log("Respuesta de la API de pasajes:", pasajeResponse);

      const asientosSeleccionadosDetalles = selectedAsientos.map(seatId =>
        asientos.find(a => a.idAsiento === seatId)
      ).filter((seat): seat is Asiento => seat !== undefined); // Filter undefined for typing

      setPurchaseSummary({
        idViaje: selectedViaje.idRutas, // We save the trip ID here
        viaje: selectedViaje,
        pasajeros: pasajeros,
        asientosSeleccionadosDetalles: asientosSeleccionadosDetalles,
        totalPagar: selectedViaje.costo * selectedAsientos.length,
        // No longer using a backend endpoint for download, will be generated dynamically
        ticketDownloadUrl: undefined,
      });

      // We don't call handleBackToList here, as we want to show the summary
    } catch (err: any) {
      setError(`Ocurrió un error al procesar la compra: ${err.message || 'Error desconocido'}. Verifique los datos o inténtelo más tarde.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NUEVA FUNCIÓN PARA GENERAR Y DESCARGAR EL PDF ⭐
  const handleDownloadTicket = async () => {
    if (!purchaseSummary) return;

    setLoading(true);
    try {
      // Crear un div temporal para el contenido del PDF
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.color = '#000'; // Texto en negro
      pdfContent.style.fontSize = '12px';
      pdfContent.style.lineHeight = '1.5';
      pdfContent.style.width = '210mm'; // Ancho A4
      pdfContent.style.boxSizing = 'border-box';
      pdfContent.style.backgroundColor = '#fff'; // Fondo blanco

      // Generar un número de boleto único basado en el ID de viaje y timestamp
      const ticketNumber = `T-${purchaseSummary.idViaje}-${Date.now().toString().slice(-6)}`;

      // Contenido HTML para el PDF
      pdfContent.innerHTML = `
      <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 5px;">BOLETO DE VIAJE</h1>
        <p style="text-align: center; font-size: 14px; margin-bottom: 10px;">N° ${ticketNumber}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">INFORMACIÓN DEL VIAJE</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="width: 30%; padding: 3px 0; font-weight: bold;">Ruta:</td>
            <td style="padding: 3px 0;">${purchaseSummary.viaje.rutaDTO.nombre}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Fecha:</td>
            <td>${new Date(purchaseSummary.viaje.fechaSalida).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Hora:</td>
            <td>${purchaseSummary.viaje.horaSalida}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Bus:</td>
            <td>${purchaseSummary.viaje.busDTO.placa}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Asientos:</td>
            <td>${purchaseSummary.asientosSeleccionadosDetalles.map(a => a.descripcion).join(', ')}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">PASAJEROS</h2>
        ${purchaseSummary.pasajeros.map(p => `
          <div style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
            <p style="font-weight: bold; margin-bottom: 5px;">${p.nombres} ${p.apellidos}</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 30%; padding: 2px 0;">DNI:</td>
                <td style="padding: 2px 0;">${p.dni}</td>
              </tr>
              <tr>
                <td>Edad:</td>
                <td>${p.edad}</td>
              </tr>
            </table>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: right; margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
        <p style="font-size: 20px; font-weight: bold;">TOTAL: S/. ${purchaseSummary.totalPagar.toFixed(2)}</p>
      </div>
      
      <!-- Código de barras simulado -->
      <div style="margin-top: 30px; text-align: center;">
        <div style="display: inline-block; padding: 10px; border: 1px solid #000;">
          <p style="font-family: 'Libre Barcode 128', cursive; font-size: 36px; letter-spacing: 2px; margin: 0;">
            *${ticketNumber}*
          </p>
          <p style="font-family: monospace; font-size: 12px; margin-top: 5px;">
            ${ticketNumber}
          </p>
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 10px; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
        <p>Este boleto es válido solo para la fecha y hora indicadas.</p>
        <p>Presentar DNI al abordar. No reembolsable.</p>
      </div>
    `;

      // Añadir fuentes para el código de barras
      const style = document.createElement('style');
      style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap');
    `;
      pdfContent.appendChild(style);

      // Añadir contenido al body temporalmente
      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        windowWidth: pdfContent.scrollWidth,
        windowHeight: pdfContent.scrollHeight,
        backgroundColor: '#fff' // Fondo blanco
      });

      // Eliminar el contenido temporal
      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // Ancho A4 en mm
      const pageHeight = 297; // Alto A4 en mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`boleto_${ticketNumber}.pdf`);

    } catch (err) {
      console.error("Error al generar el PDF:", err);
      setError("No se pudo generar el boleto PDF. Por favor, inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Function to render an individual seat ⭐
  const renderAsiento = (asiento: Asiento, isSelected: boolean) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    const isOcupado = asiento.estado === 'ocupado';

    if (isOcupado) {
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-500';
    } else if (isSelected) {
      bgColor = 'bg-orange-500';
      textColor = 'text-white';
    } else { // Available
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    }

    return (
      <button
        key={asiento.idAsiento}
        disabled={isOcupado}
        onClick={() => handleSeatClick(asiento.idAsiento)}
        className={`${bgColor} ${textColor} p-2 rounded-md text-center text-sm font-medium flex flex-col items-center justify-center h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity 
          ${isOcupado ? 'cursor-not-allowed line-through' : 'hover:bg-green-200 hover:text-green-900'} 
          ${isSelected ? 'ring-2 ring-orange-600' : ''} 
        `}
        title={`Asiento: ${asiento.descripcion}, Estado: ${asiento.estado}`}
      >
        <Armchair className="h-6 w-6" />
        <span className="text-xs font-bold mt-1">{asiento.descripcion}</span>
      </button>
    );
  };

  // --- RENDERING OF BUS SEATS WITH CSS GRID ---
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

    if (!asientos || asientos.length === 0) {
      return (
        <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">No se encontraron asientos disponibles.</p>
          <p className="text-sm">Es posible que todos los asientos estén ocupados o que no haya asientos configurados para este bus.</p>
        </div>
      );
    }

    const pisosDisponibles = [...new Set(asientos.map(a => a.piso))].sort((a, b) => a - b);

    return (
      <div className="space-y-6">
        {pisosDisponibles.map(piso => {
          const asientosPiso = asientos.filter(a => a.piso === piso);

          // Get all unique rows and columns for this floor
          const uniqueFilas = [...new Set(asientosPiso.map(a => a.fila))].sort();
          const uniqueColumnas = [...new Set(asientosPiso.map(a => parseInt(a.columna, 10)))].sort((a, b) => a - b);

          if (uniqueFilas.length === 0 || uniqueColumnas.length === 0) {
            return (
              <div key={piso} className="text-center py-8 text-gray-500">
                <Layers className="h-12 w-12 mx-auto mb-3" />
                <p>No hay asientos válidos para mostrar en el Piso {piso}.</p>
              </div>
            );
          }

          const maxColNum = uniqueColumnas[uniqueColumnas.length - 1];
          let gridTemplateColumns = '';
          let aisleColumnIndex = -1;

          // Determine grid layout based on maxColNum
          if (maxColNum >= 4) { // Typical 2-2 bus layout
            gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) 0.5fr repeat(2, minmax(0, 1fr))'; // 2 seats, narrow aisle, 2 seats
            aisleColumnIndex = 2; // Aisle is the 3rd column in the grid (index 2)
          } else if (maxColNum === 3) { // Typical 2-1 bus layout
            gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) 0.5fr minmax(0, 1fr)'; // 2 seats, narrow aisle, 1 seat
            aisleColumnIndex = 2; // Aisle is the 3rd column in the grid (index 2)
          } else { // Less than 3 columns, no distinct aisle in the middle
            gridTemplateColumns = `repeat(${maxColNum}, minmax(0, 1fr))`;
          }

          const seatMap = new Map<string, Asiento>();
          asientosPiso.forEach(asiento => {
            seatMap.set(`${asiento.fila}-${asiento.columna}`, asiento);
          });

          const renderGridRow = (fila: string) => {
            const rowElements = [];
            let currentSeatCol = 1; // To map to the logical seat columns (1, 2, 3, 4)

            // Iterate through potential grid columns, including the aisle slot
            // The total number of grid columns will be maxColNum + 1 if there's an aisle, else maxColNum
            const totalGridCols = uniqueColumnas.length + (aisleColumnIndex !== -1 ? 1 : 0);

            for (let i = 0; i < totalGridCols; i++) {
              if (aisleColumnIndex !== -1 && i === aisleColumnIndex) {
                // Render the aisle
                rowElements.push(
                  <div key={`${fila}-aisle-${i}`} className="h-16 w-full flex items-center justify-center text-xs text-gray-400 bg-gray-100 rounded-md">
                    {/* Aisle */}
                  </div>
                );
              } else {
                // Render seat or empty space
                const asiento = seatMap.get(`${fila}-${currentSeatCol}`);
                if (asiento) {
                  const isSelected = selectedAsientos.includes(asiento.idAsiento);
                  rowElements.push(renderAsiento(asiento, isSelected));
                } else {
                  // Empty space where no seat is defined
                  rowElements.push(
                    <div
                      key={`${fila}-empty-${currentSeatCol}-${i}`}
                      className="h-16 w-16 bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400"
                    >
                      {/* Empty */}
                    </div>
                  );
                }
                currentSeatCol++; // Move to the next logical seat column
              }
            }
            return rowElements;
          };

          return (
            <div key={piso} className="mb-8 border rounded-lg p-4 bg-gray-50">
              <h4 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Piso {piso}</h4>
              <div className="relative p-4 bg-white rounded-lg shadow-inner">
                {/* Front of the Bus */}
                <div className="flex justify-center mb-4">
                  <div className="w-1/3 h-10 bg-gray-300 rounded-b-lg flex items-center justify-center text-sm text-gray-700 font-semibold">
                    Frente del Bus
                  </div>
                </div>

                {/* Seat Grid */}
                <div
                  className="grid gap-2 mx-auto"
                  style={{ gridTemplateColumns: gridTemplateColumns }}
                >
                  {uniqueFilas.map(fila => (
                    <React.Fragment key={fila}>
                      {renderGridRow(fila)}
                    </React.Fragment>
                  ))}
                </div>

                {/* Back of the Bus */}
                <div className="flex justify-center mt-4">
                  <div className="w-1/3 h-10 bg-gray-300 rounded-t-lg flex items-center justify-center text-sm text-gray-700 font-semibold">
                    Parte Trasera
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- PURCHASE SUMMARY VIEW ⭐ NEW VIEW ⭐ ---
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
            {/* ⭐ NEW SECTION: Trip ID ⭐ */}
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
            {/* ⭐ NEW: Download Ticket Button ⭐ */}
            <button
              onClick={handleDownloadTicket}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium shadow-lg mt-6"
              disabled={loading}
            >
              <Download className="h-5 w-5 mr-2" />
              {loading ? 'Generando PDF...' : 'Descargar Boleto'}
            </button>
            {/* END NEW: Download Ticket Button */}
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

  // --- SEAT AND PASSENGER SELECTION VIEW ---
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

  // --- INITIAL TRIP LIST VIEW ---
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