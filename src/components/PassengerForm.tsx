import React from 'react';
import { UserPlus, Armchair } from 'lucide-react';

interface Pasajero {
  dni: string;
  nombres: string;
  apellidos: string;
  edad: string;
}

interface PassengerFormProps {
  selectedAsientos: number[];
  asientos: Array<{
    idAsiento: number;
    descripcion: string;
  }>;
  pasajeros: Pasajero[];
  onPassengerChange: (index: number, field: keyof Pasajero, value: string) => void;
}

const PassengerForm: React.FC<PassengerFormProps> = ({ 
  selectedAsientos, 
  asientos, 
  pasajeros, 
  onPassengerChange 
}) => {
  if (selectedAsientos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
        <div className="text-center text-gray-500">
          <Armchair className="h-12 w-12 mx-auto mb-4" />
          <p className="font-semibold">Selecciona uno o más asientos en el mapa.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <UserPlus className="h-6 w-6 text-orange-500 mr-3" />
        <h4 className="text-xl font-bold">Datos de los Pasajeros</h4>
      </div>
      <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
        {selectedAsientos.map((seatId, index) => {
          const seat = asientos.find(a => a.idAsiento === seatId);
          return (
            <div key={seatId} className="bg-gray-50 p-4 rounded-lg">
              <p className="font-bold text-gray-800 mb-3">Pasajero para el Asiento {seat?.descripcion}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="DNI" 
                  value={pasajeros[index]?.dni || ''}
                  onChange={e => onPassengerChange(index, 'dni', e.target.value)}
                  className="w-full p-2 border rounded" 
                />
                <input 
                  type="text" 
                  placeholder="Nombres" 
                  value={pasajeros[index]?.nombres || ''}
                  onChange={e => onPassengerChange(index, 'nombres', e.target.value)}
                  className="w-full p-2 border rounded" 
                />
                <input 
                  type="text" 
                  placeholder="Apellidos" 
                  value={pasajeros[index]?.apellidos || ''}
                  onChange={e => onPassengerChange(index, 'apellidos', e.target.value)}
                  className="w-full p-2 border rounded" 
                />
                <input 
                  type="number" 
                  placeholder="Edad" 
                  value={pasajeros[index]?.edad || ''}
                  onChange={e => onPassengerChange(index, 'edad', e.target.value)}
                  className="w-full p-2 border rounded" 
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PassengerForm;