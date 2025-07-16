import React from 'react';
import { Armchair, Layers, AlertTriangle } from 'lucide-react';

interface SeatMapProps {
  asientos: Array<{
    idAsiento: number;
    piso: number;
    fila: string;
    columna: string;
    descripcion: string;
    estado: 'disponible' | 'ocupado' | 'reservado';
  }>;
  selectedAsientos: number[];
  onSeatClick: (seatId: number) => void;
  loading: boolean;
  error: string | null;
}

const SeatMap: React.FC<SeatMapProps> = ({ asientos, selectedAsientos, onSeatClick, loading, error }) => {
  const renderAsiento = (asiento: any, isSelected: boolean) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    let cursorStyle = 'cursor-pointer';
    let hoverStyle = 'hover:opacity-80';
    let additionalStyles = '';

    switch (asiento.estado) {
      case 'ocupado':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        cursorStyle = 'cursor-not-allowed';
        additionalStyles = 'line-through';
        break;
      case 'reservado':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        cursorStyle = 'cursor-not-allowed';
        additionalStyles = 'line-through';
        break;
      case 'disponible':
        bgColor = isSelected ? 'bg-orange-500' : 'bg-green-100';
        textColor = isSelected ? 'text-white' : 'text-green-800';
        hoverStyle = 'hover:bg-green-200 hover:text-green-900';
        additionalStyles = isSelected ? 'ring-2 ring-orange-600' : '';
        break;
    }

    return (
      <button
        key={asiento.idAsiento}
        disabled={asiento.estado !== 'disponible'}
        onClick={() => asiento.estado === 'disponible' && onSeatClick(asiento.idAsiento)}
        className={`${bgColor} ${textColor} p-2 rounded-md text-center text-sm font-medium flex flex-col items-center justify-center h-16 w-16 ${cursorStyle} ${hoverStyle} transition-opacity ${additionalStyles}`}
        title={`Asiento: ${asiento.descripcion}, Estado: ${asiento.estado}`}
      >
        <Armchair className="h-6 w-6" />
        <span className="text-xs font-bold mt-1">{asiento.descripcion}</span>
      </button>
    );
  };

  if (loading) return <p className="text-center text-gray-500">Cargando asientos...</p>;
  if (error && error.includes('asientos')) {
    return (
      <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">Error al cargar asientos:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  if (!asientos || asientos.length === 0) {
    return (
      <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No se encontraron asientos disponibles.</p>
      </div>
    );
  }

  const pisosDisponibles = [...new Set(asientos.map(a => a.piso))].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {pisosDisponibles.map(piso => {
        const asientosPiso = asientos.filter(a => a.piso === piso);
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

        if (maxColNum >= 4) {
          gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) 0.5fr repeat(2, minmax(0, 1fr))';
          aisleColumnIndex = 2;
        } else if (maxColNum === 3) {
          gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) 0.5fr minmax(0, 1fr)';
          aisleColumnIndex = 2;
        } else {
          gridTemplateColumns = `repeat(${maxColNum}, minmax(0, 1fr))`;
        }

        const seatMap = new Map<string, any>();
        asientosPiso.forEach(asiento => {
          seatMap.set(`${asiento.fila}-${asiento.columna}`, asiento);
        });

        const renderGridRow = (fila: string) => {
          const rowElements = [];
          let currentSeatCol = 1;
          const totalGridCols = uniqueColumnas.length + (aisleColumnIndex !== -1 ? 1 : 0);

          for (let i = 0; i < totalGridCols; i++) {
            if (aisleColumnIndex !== -1 && i === aisleColumnIndex) {
              rowElements.push(
                <div key={`${fila}-aisle-${i}`} className="h-16 w-full flex items-center justify-center text-xs text-gray-400 bg-gray-100 rounded-md" />
              );
            } else {
              const asiento = seatMap.get(`${fila}-${currentSeatCol}`);
              if (asiento) {
                const isSelected = selectedAsientos.includes(asiento.idAsiento);
                rowElements.push(renderAsiento(asiento, isSelected));
              } else {
                rowElements.push(
                  <div
                    key={`${fila}-empty-${currentSeatCol}-${i}`}
                    className="h-16 w-16 bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400"
                  />
                );
              }
              currentSeatCol++;
            }
          }
          return rowElements;
        };

        return (
          <div key={piso} className="mb-8 border rounded-lg p-4 bg-gray-50">
            <h4 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Piso {piso}</h4>
            <div className="relative p-4 bg-white rounded-lg shadow-inner">
              <div className="flex justify-center mb-4">
                <div className="w-1/3 h-10 bg-gray-300 rounded-b-lg flex items-center justify-center text-sm text-gray-700 font-semibold">
                  Frente del Bus
                </div>
              </div>

              <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns }}>
                {uniqueFilas.map(fila => (
                  <React.Fragment key={fila}>{renderGridRow(fila)}</React.Fragment>
                ))}
              </div>

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

export default SeatMap;