import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bus, ChevronUp, ChevronDown, Layers, Download } from 'lucide-react';
import ApiService from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Pasajero {
  idUsuario: number;
  dni: string;
  nombres: string;
  apellidos: string;
  edad: number;
  permisos: string;
  idAsiento: number | null;
}

interface Asiento {
  idAsiento: number;
  piso: number;
  fila: string;
  columna: string;
  descripcion: string;
  estado: string;
  idBus: number;
  usuario: Pasajero | null;
}

interface Conductor {
  idTrabajador: number;
  nombre: string;
  apellido: string;
  dni: string;
  estado: string;
}

interface Bus {
  idCarro: number;
  placa: string;
  idConductor: number;
  conductor?: {
    nombre: string;
    apellido: string;
    dni?: string;
    estado?: string;
  };
  asientos?: Asiento[];
}

const BusesManager: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    idConductor: ''
  });
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [asientoForm, setAsientoForm] = useState({
    piso: 1,
    fila: '',
    columna: '',
    descripcion: '',
    estado: 'DISPONIBLE',
    idBus: 0
  });
  const [showAsientoForm, setShowAsientoForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [busesResponse, conductoresResponse] = await Promise.all([
        ApiService.obtenerBuses(),
        ApiService.obtenerConductores()
      ]);

      // Filtrar solo conductores disponibles
      const conductoresDisponibles = conductoresResponse.filter(
        (conductor) => conductor.estado === 'DISPONIBLE'
      );

      const busesConConductores = busesResponse.map((bus) => {
        const conductor = conductoresResponse.find(
          (c) => c.idTrabajador === bus.idConductor
        );
        return {
          ...bus,
          conductor: conductor
            ? {
                nombre: conductor.nombre,
                apellido: conductor.apellido,
                dni: conductor.dni,
                estado: conductor.estado,
              }
            : undefined,
        };
      });

      setBuses(busesConConductores);
      setConductores(conductoresDisponibles);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadBusDetails = async (bus: Bus) => {
    try {
      setLoading(true);
      setError(null);
      const detalles = await ApiService.obtenerAsientosConPasajeros(bus.idCarro);
      
      const detallesNormalizados = detalles.map(asiento => ({
        ...asiento,
        estado: asiento.estado.toUpperCase()
      }));
      
      const updatedBus = { ...bus, asientos: detallesNormalizados };
      setBuses(buses.map(b => b.idCarro === bus.idCarro ? updatedBus : b));
      setSelectedBus(updatedBus);
    } catch (error) {
      console.error('Error al cargar detalles del bus:', error);
      setError('Error al cargar los detalles del bus.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!selectedBus || !selectedBus.asientos) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(18);
    doc.text(`Distribución de Asientos - Bus ${selectedBus.placa}`, 148.5, 15, { align: 'center' });

    if (selectedBus.conductor) {
      doc.setFontSize(12);
      doc.text(
        `Conductor: ${selectedBus.conductor.nombre} ${selectedBus.conductor.apellido}${selectedBus.conductor.dni ? ` (DNI: ${selectedBus.conductor.dni})` : ''}`,
        148.5, 25, { align: 'center' }
      );
    }

    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 277, 30);

    const asientosPorPiso: Record<number, Asiento[]> = {};
    selectedBus.asientos.forEach(asiento => {
      if (!asientosPorPiso[asiento.piso]) {
        asientosPorPiso[asiento.piso] = [];
      }
      asientosPorPiso[asiento.piso].push(asiento);
    });

    let yPosition = 40;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    Object.entries(asientosPorPiso).forEach(([piso, asientos]) => {
      if (yPosition + 100 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(14);
      doc.text(`Planta ${piso}`, 20, yPosition);
      yPosition += 10;

      drawBusLayout(doc, asientos, yPosition);
      yPosition += 50;

      const pasajeros = asientos.filter(a => a.estado === 'OCUPADO' || a.estado === 'RESERVADO');
      if (pasajeros.length > 0) {
        doc.setFontSize(12);
        
        if (yPosition + 10 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.text(`Pasajeros - Planta ${piso}`, 20, yPosition);
        yPosition += 5;

        const headers = [['Asiento', 'Nombre', 'DNI', 'Estado']];
        const data = pasajeros
          .sort((a, b) => a.fila.localeCompare(b.fila) || a.columna.localeCompare(b.columna))
          .map(asiento => [
            `${asiento.fila}${asiento.columna}`,
            asiento.usuario ? `${asiento.usuario.nombres} ${asiento.usuario.apellidos}` : '-',
            asiento.usuario?.dni || '-',
            asiento.estado.toLowerCase()
          ]);

        autoTable(doc, {
          startY: yPosition,
          head: headers,
          body: data,
          margin: { left: 20 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
          didDrawPage: (data) => {
            if (data.pageNumber > 1) {
              yPosition = data.settings.margin.top;
            }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        
        if (yPosition + 10 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text('No hay pasajeros en esta planta', 20, yPosition);
        yPosition += 15;
      }

      yPosition += 10;
    });

    doc.save(`asientos-bus-${selectedBus.placa}.pdf`);
  };

  const drawBusLayout = (doc: jsPDF, asientos: Asiento[], y: number) => {
    const startX = 20;
    const seatSize = 8;
    const gap = 2;
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.roundedRect(startX, y, 240, 40, 2, 2, 'S');
    
    doc.setFillColor(230, 230, 230);
    doc.rect(startX + 80, y, 80, 40, 'F');
    doc.text('Pasillo', startX + 120, y + 20, { align: 'center' });
    
    const filas: Record<string, Asiento[]> = {};
    asientos.forEach(asiento => {
      if (!filas[asiento.fila]) filas[asiento.fila] = [];
      filas[asiento.fila].push(asiento);
    });
    
    let seatY = y + 5;
    Object.entries(filas).forEach(([fila, asientosFila]) => {
      const asientosIzq = asientosFila
        .filter(a => ['1', '2'].includes(a.columna))
        .sort((a, b) => a.columna.localeCompare(b.columna));
      
      let seatX = startX + 70;
      asientosIzq.forEach(asiento => {
        if (asiento.estado === 'OCUPADO') doc.setFillColor(231, 76, 60);
        else if (asiento.estado === 'RESERVADO') doc.setFillColor(241, 196, 15);
        else doc.setFillColor(46, 204, 113);
        
        doc.roundedRect(seatX - seatSize - gap, seatY, seatSize, seatSize, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(`${fila}${asiento.columna}`, seatX - seatSize/2 - gap, seatY + seatSize/2 + 1, { align: 'center' });
        
        seatX -= seatSize + gap;
      });
      
      seatY += seatSize + gap;
    });
    
    seatY = y + 5;
    Object.entries(filas).forEach(([fila, asientosFila]) => {
      const asientosDer = asientosFila
        .filter(a => ['3', '4'].includes(a.columna))
        .sort((a, b) => a.columna.localeCompare(b.columna));
      
      let seatX = startX + 160;
      asientosDer.forEach(asiento => {
        if (asiento.estado === 'OCUPADO') doc.setFillColor(231, 76, 60);
        else if (asiento.estado === 'RESERVADO') doc.setFillColor(241, 196, 15);
        else doc.setFillColor(46, 204, 113);
        
        doc.roundedRect(seatX, seatY, seatSize, seatSize, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(`${fila}${asiento.columna}`, seatX + seatSize/2, seatY + seatSize/2 + 1, { align: 'center' });
        
        seatX += seatSize + gap;
      });
      
      seatY += seatSize + gap;
    });
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(46, 204, 113);
    doc.roundedRect(startX + 180, y + 35, 6, 6, 1, 1, 'F');
    doc.text('Disponible', startX + 190, y + 38);
    
    doc.setFillColor(241, 196, 15);
    doc.roundedRect(startX + 180, y + 30, 6, 6, 1, 1, 'F');
    doc.text('Reservado', startX + 190, y + 33);
    
    doc.setFillColor(231, 76, 60);
    doc.roundedRect(startX + 180, y + 25, 6, 6, 1, 1, 'F');
    doc.text('Ocupado', startX + 190, y + 28);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingBus) {
        await ApiService.editarBus(editingBus.idCarro, {
          ...formData,
          idConductor: parseInt(formData.idConductor)
        });
      } else {
        const newBus = await ApiService.crearBus({ 
          ...formData,
          idConductor: parseInt(formData.idConductor)
        });

        const filas = ['A', 'B', 'C', 'D', 'E'];
        const columnas = ['1', '2', '3', '4'];
        
        for (const fila of filas) {
          for (const columna of columnas) {
            const asientoData = {
              piso: 1,
              fila: fila,
              columna: columna,
              descripcion: `Asiento ${fila}${columna}`,
              estado: 'DISPONIBLE',
              idBus: newBus.idCarro
            };
            await ApiService.crearAsiento(asientoData);
          }
        }
        await loadBusDetails(newBus);
      }
      
      await cargarDatos();
      setShowForm(false);
      setEditingBus(null);
      setFormData({ placa: '', idConductor: '' });
    } catch (error) {
      console.error('Error al guardar bus:', error);
      setError('Error al guardar el bus. Por favor, verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsientoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await ApiService.crearAsiento({
        ...asientoForm,
        idBus: selectedBus?.idCarro || 0
      });
      
      if (selectedBus) {
        await loadBusDetails(selectedBus);
      }
      setShowAsientoForm(false);
      setAsientoForm({
        piso: 1,
        fila: '',
        columna: '',
        descripcion: '',
        estado: 'DISPONIBLE',
        idBus: selectedBus?.idCarro || 0
      });
    } catch (error) {
      console.error('Error al guardar asiento:', error);
      setError('Error al guardar el asiento. Por favor, verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      placa: bus.placa,
      idConductor: bus.idConductor.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este bus?')) {
      try {
        setLoading(true);
        setError(null);
        await ApiService.eliminarBus(id);
        await cargarDatos();
        if (selectedBus?.idCarro === id) {
          setSelectedBus(null);
        }
      } catch (error) {
        console.error('Error al eliminar bus:', error);
        setError('Error al eliminar el bus. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBus(null);
    setFormData({ placa: '', idConductor: '' });
    setError(null);
  };

  const renderAsiento = (asiento: Asiento, isWindowSide: boolean) => {
    let bgColor = 'bg-gray-200';
    if (asiento.estado === 'OCUPADO') bgColor = 'bg-red-500 text-white';
    else if (asiento.estado === 'RESERVADO') bgColor = 'bg-yellow-500 text-white';
    else if (asiento.estado === 'DISPONIBLE') bgColor = 'bg-green-500 text-white';

    return (
      <div 
        key={`${asiento.piso}-${asiento.fila}${asiento.columna}`}
        className={`${bgColor} p-2 rounded-md text-center text-sm font-medium cursor-pointer hover:opacity-80 relative`}
        title={
          asiento.usuario 
            ? `${asiento.fila}${asiento.columna} - ${asiento.usuario.nombres} ${asiento.usuario.apellidos} (DNI: ${asiento.usuario.dni})`
            : `${asiento.fila}${asiento.columna} - ${asiento.descripcion}`
        }
      >
        {asiento.fila}{asiento.columna}
        {isWindowSide && (
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-blue-300 rounded"></div>
        )}
      </div>
    );
  };

  const renderPlanta = (planta: number) => {
    if (!selectedBus?.asientos) return null;
    
    const asientosPlanta = selectedBus.asientos.filter(a => a.piso === planta);
    
    const filas: {[key: string]: Asiento[]} = {};
    asientosPlanta.forEach(asiento => {
      if (!filas[asiento.fila]) filas[asiento.fila] = [];
      filas[asiento.fila].push(asiento);
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Layers className="mr-2" />
          Planta {planta}
        </h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex flex-col items-center mb-4">
            <div className="w-full h-4 bg-gray-400 rounded-t-lg mb-2"></div>
            
            <div className="flex w-full">
              <div className="w-2/6 flex flex-col items-end pr-2">
                <div className="w-full h-4 bg-blue-100 mb-1 rounded-l"></div>
                {Object.entries(filas).map(([fila, asientosFila]) => {
                  const asientosIzquierda = asientosFila
                    .filter(a => ['1', '2'].includes(a.columna))
                    .sort((a, b) => a.columna.localeCompare(b.columna));
                  
                  return (
                    <div key={`left-${fila}`} className="w-full flex justify-end space-x-1 mb-1">
                      {asientosIzquierda.map(asiento => renderAsiento(asiento, true))}
                    </div>
                  );
                })}
                <div className="w-full h-4 bg-blue-100 mt-1 rounded-l"></div>
              </div>
              
              <div className="w-2/6 h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                Pasillo
              </div>
              
              <div className="w-2/6 flex flex-col items-start pl-2">
                <div className="w-full h-4 bg-blue-100 mb-1 rounded-r"></div>
                {Object.entries(filas).map(([fila, asientosFila]) => {
                  const asientosDerecha = asientosFila
                    .filter(a => ['3', '4'].includes(a.columna))
                    .sort((a, b) => a.columna.localeCompare(b.columna));
                  
                  return (
                    <div key={`right-${fila}`} className="w-full flex justify-start space-x-1 mb-1">
                      {asientosDerecha.map(asiento => renderAsiento(asiento, true))}
                    </div>
                  );
                })}
                <div className="w-full h-4 bg-blue-100 mt-1 rounded-r"></div>
              </div>
            </div>
            
            <div className="w-full h-4 bg-gray-400 rounded-b-lg mt-2"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Bus className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Buses</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Bus
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placa
              </label>
              <input
                type="text"
                value={formData.placa}
                onChange={(e) => setFormData({...formData, placa: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conductor (solo disponibles)
              </label>
              <select
                value={formData.idConductor}
                onChange={(e) => setFormData({...formData, idConductor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading || conductores.length === 0}
              >
                <option value="">Seleccionar conductor</option>
                {conductores.length === 0 ? (
                  <option value="" disabled>
                    No hay conductores disponibles
                  </option>
                ) : (
                  conductores.map((conductor) => (
                    <option
                      key={conductor.idTrabajador}
                      value={conductor.idTrabajador}
                    >
                      {conductor.nombre} {conductor.apellido} - DNI: {conductor.dni}
                    </option>
                  ))
                )}
              </select>
              {conductores.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No hay conductores disponibles. Registre conductores con estado DISPONIBLE.
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading || conductores.length === 0}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conductor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && buses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center">
                      Cargando buses...
                    </td>
                  </tr>
                ) : buses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No hay buses registrados
                    </td>
                  </tr>
                ) : (
                  buses.map((bus) => (
                    <tr 
                      key={bus.idCarro} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedBus?.idCarro === bus.idCarro ? 'bg-blue-50' : ''}`}
                      onClick={() => loadBusDetails(bus)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bus.placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bus.conductor ? `${bus.conductor.nombre} ${bus.conductor.apellido}` : 'Sin conductor'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(bus);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(bus.idCarro);
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {selectedBus ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Asientos del Bus: {selectedBus.placa}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={generatePDF}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors flex items-center text-sm"
                    disabled={loading}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Generar PDF
                  </button>
                  <button
                    onClick={() => {
                      setAsientoForm({
                        piso: 1,
                        fila: '',
                        columna: '',
                        descripcion: '',
                        estado: 'DISPONIBLE',
                        idBus: selectedBus.idCarro
                      });
                      setShowAsientoForm(true);
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm"
                    disabled={loading}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo Asiento
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setCurrentFloor(1)}
                  className={`flex items-center px-3 py-1 rounded-lg ${currentFloor === 1 ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                  disabled={loading}
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Planta 1
                </button>
                <button
                  onClick={() => setCurrentFloor(2)}
                  className={`flex items-center px-3 py-1 rounded-lg ${currentFloor === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                  disabled={loading}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Planta 2
                </button>
              </div>

              {loading && !selectedBus.asientos ? (
                <div className="text-center py-4">Cargando asientos...</div>
              ) : renderPlanta(currentFloor)}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Seleccione un bus para ver sus asientos
            </div>
          )}
        </div>
      </div>

      {showAsientoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nuevo Asiento</h2>
            <form onSubmit={handleAsientoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso
                </label>
                <select
                  value={asientoForm.piso}
                  onChange={(e) => setAsientoForm({...asientoForm, piso: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                >
                  <option value="1">Planta 1</option>
                  <option value="2">Planta 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fila (ej. A, B, C)
                </label>
                <input
                  type="text"
                  value={asientoForm.fila}
                  onChange={(e) => setAsientoForm({...asientoForm, fila: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                  maxLength={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Columna (1-4)
                </label>
                <select
                  value={asientoForm.columna}
                  onChange={(e) => setAsientoForm({...asientoForm, columna: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar columna</option>
                  <option value="1">Columna 1 (Ventana izquierda)</option>
                  <option value="2">Columna 2 (Pasillo izquierdo)</option>
                  <option value="3">Columna 3 (Pasillo derecho)</option>
                  <option value="4">Columna 4 (Ventana derecha)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={asientoForm.descripcion}
                  onChange={(e) => setAsientoForm({...asientoForm, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={asientoForm.estado}
                  onChange={(e) => setAsientoForm({...asientoForm, estado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={loading}
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="OCUPADO">Ocupado</option>
                  <option value="RESERVADO">Reservado</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAsientoForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusesManager;