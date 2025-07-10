import React, { useState, useEffect } from 'react';
import { 
  Users, Bus, MapPin, Route, UserCheck, Calendar as CalendarIcon,
  LogOut, Settings, BarChart3, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import AdministradoresManager from './admin/AdministradoresManager';
import AgenciasManager from './admin/AgenciasManager';
import RutasManager from './admin/RutasManager';
import ConductoresManager from './admin/ConductoresManager';
import BusesManager from './admin/BusesManager';
import AsientosManager from './admin/AsientosManager';
import ViajesManager from './admin/ViajesManager';
import UsuariosManager from './admin/UsuariosManager';
import PasajesManager from './admin/PasajesManager';

interface Viaje {
  idViaje?: number;
  idRutas?: number;
  fechaSalida: string;
  horaSalida: string;
  costo: number;
  idRuta: number;
  idCarro: number | null;
  busDTO?: {
    idCarro: number;
    placa: string;
    idConductor: number | null;
  };
  rutaDTO?: {
    idRuta: number;
    nombre: string;
    idAdministrador: number;
    agenciasIds: number[] | null;
    agenciaDTOS: any[] | null;
  };
}

interface Ruta {
  idRuta: number;
  nombre: string;
}

interface Bus {
  idCarro: number;
  placa: string;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddViajeForm, setShowAddViajeForm] = useState(false);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newViaje, setNewViaje] = useState({
    horaSalida: '',
    fechaSalida: '',
    costo: '',
    idRuta: '',
    idCarro: ''
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'administradores', label: 'Administradores', icon: Settings },
    { id: 'agencias', label: 'Agencias', icon: MapPin },
    { id: 'rutas', label: 'Rutas', icon: Route },
    { id: 'conductores', label: 'Conductores', icon: UserCheck },
    { id: 'buses', label: 'Buses', icon: Bus },
    { id: 'asientos', label: 'Asientos', icon: CalendarIcon },
    { id: 'viajes', label: 'Viajes', icon: CalendarIcon },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'pasajes', label: 'Pasajes', icon: CalendarIcon },
  ];

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [viajesResponse, rutasResponse, busesResponse] = await Promise.all([
          ApiService.obtenerViajes(),
          ApiService.obtenerRutas(),
          ApiService.obtenerBuses()
        ]);
        
        // Filtrar buses que no tengan idBus definido
        const busesFiltrados = busesResponse.filter((bus: Bus) => bus.idCarro !== undefined && bus.idCarro !== null);
        
        // Mapear los viajes para adaptarlos a nuestra interfaz
        const viajesAdaptados = viajesResponse.map((viaje: any) => ({
          idViaje: viaje.idRutas,
          fechaSalida: viaje.fechaSalida,
          horaSalida: viaje.horaSalida,
          costo: viaje.costo,
          idRuta: viaje.idRuta,
          idCarro: viaje.idCarro,
          busDTO: viaje.busDTO,
          rutaDTO: viaje.rutaDTO
        }));
        
        setViajes(viajesAdaptados);
        setRutas(rutasResponse);
        setBuses(busesFiltrados);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeSection === 'dashboard') {
      cargarDatos();
    }
  }, [activeSection]);

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    // Días del mes anterior
    for (let i = 0; i < startingDay; i++) {
      days.push({
        day: prevMonthDays - startingDay + i + 1,
        currentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - startingDay + i + 1).toISOString().split('T')[0]
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      const hasViajes = viajes.some(v => v.fechaSalida === dateStr);
      
      days.push({
        day: i,
        currentMonth: true,
        date: dateStr,
        hasViajes
      });
    }
    
    // Días del próximo mes
    const totalDays = days.length;
    const remainingDays = 7 - (totalDays % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          currentMonth: false,
          date: new Date(year, month + 1, i).toISOString().split('T')[0]
        });
      }
    }
    
    // Dividir en semanas
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
    setShowAddViajeForm(false);
  };

 const handleAddViaje = async () => {
  if (!selectedDate) return;
  
  // Validar que todos los campos estén completos
  if (!newViaje.horaSalida || !newViaje.idRuta || !newViaje.idCarro || !newViaje.costo) {
    alert('Por favor complete todos los campos del formulario');
    return;
  }

  try {
    setLoading(true);

    // Validar que el bus esté seleccionado
    if (!newViaje.idCarro) {
      throw new Error("Debe seleccionar un bus");
    }

    // Obtener el bus seleccionado
    const busSeleccionado = buses.find(b => b.idCarro === parseInt(newViaje.idCarro));
    if (!busSeleccionado) {
      throw new Error("El bus seleccionado no existe");
    }

    // Obtener la ruta seleccionada
    const rutaSeleccionada = rutas.find(r => r.idRuta === parseInt(newViaje.idRuta));
    if (!rutaSeleccionada) {
      throw new Error("La ruta seleccionada no existe");
    }

    // Formatear la hora correctamente (HH:mm)
    const horaFormateada = newViaje.horaSalida.includes(':') ? 
      newViaje.horaSalida : 
      `${newViaje.horaSalida}:00`;

    const viajeData = {
      horaSalida: horaFormateada,
      fechaSalida: selectedDate,
      costo: parseFloat(newViaje.costo) || 0,
      idRuta: parseInt(newViaje.idRuta),
      idCarro: parseInt(newViaje.idCarro)
    };

    console.log('Enviando viaje:', viajeData);
    
    const nuevoViaje = await ApiService.crearViaje(viajeData);
    
    // Crear el objeto de viaje completo con todos los datos
    const viajeCompleto = {
      ...nuevoViaje,
      busDTO: {
        idCarro: busSeleccionado.idCarro,
        placa: busSeleccionado.placa,
        idConductor: null
      },
      rutaDTO: {
        idRuta: rutaSeleccionada.idRuta,
        nombre: rutaSeleccionada.nombre,
        idAdministrador: user?.id || 0, // Usar el ID del administrador logueado
        agenciasIds: null,
        agenciaDTOS: null
      }
    };
    
    setViajes(prev => [...prev, viajeCompleto]);
    
    setShowAddViajeForm(false);
    setNewViaje({
      horaSalida: '',
      fechaSalida: '',
      costo: '',
      idRuta: '',
      idCarro: ''
    });
    
  } catch (error) {
    console.error('Error al guardar viaje:', error);
    alert('Error al guardar el viaje. Por favor, verifica los datos.');
  } finally {
    setLoading(false);
  }
};
const formatLocalDate = (dateString: string) => {
  const date = new Date(dateString);
  // Ajustar por zona horaria
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

  const renderViajesDelDia = () => {
    if (!selectedDate) return null;
    
    const viajesDia = viajes.filter(v => v.fechaSalida === selectedDate);
    
    return (
      <div className="ml-6 flex-1">
        <div className="bg-white rounded-lg shadow p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              Viajes para el {formatLocalDate(selectedDate)}
            </h3>
            <button
              onClick={() => setShowAddViajeForm(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </button>
          </div>

          {showAddViajeForm ? (
            <div className="mb-6 bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Agregar nuevo viaje</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hora (HH:mm)</label>
                  <input
                    type="time"
                    value={newViaje.horaSalida}
                    onChange={(e) => setNewViaje({...newViaje, horaSalida: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ruta</label>
                  <select
                    value={newViaje.idRuta}
                    onChange={(e) => setNewViaje({...newViaje, idRuta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar ruta</option>
                    {rutas.map((ruta) => (
                      <option key={`ruta-${ruta.idRuta}`} value={ruta.idRuta}>
                        {ruta.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bus</label>
                  <select
                    value={newViaje.idCarro}
                    onChange={(e) => setNewViaje({...newViaje, idCarro: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar bus</option>
                    {buses.map((bus) => (
                      <option key={`bus-${bus.idCarro}`} value={bus.idCarro}>
                        {bus.placa}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Costo (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newViaje.costo}
                    onChange={(e) => setNewViaje({...newViaje, costo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAddViajeForm(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddViaje}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Viaje'}
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : viajesDia.length > 0 ? (
            <div className="space-y-4">
              {viajesDia.map((viaje) => (
                <div key={`viaje-${viaje.idViaje || viaje.idRutas || Date.now()}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <Bus className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="font-semibold">{viaje.busDTO?.placa || 'Bus no asignado'}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Ruta:</span> {viaje.rutaDTO?.nombre || 'Ruta no asignada'}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Hora:</span> {viaje.horaSalida}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Costo:</span> S/ {viaje.costo?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <button className="text-orange-500 hover:text-orange-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No hay viajes programados para este día</p>
              <button
                onClick={() => setShowAddViajeForm(true)}
                className="mt-4 text-orange-500 hover:text-orange-700 font-medium"
              >
                Programar un viaje
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'administradores':
        return <AdministradoresManager />;
      case 'agencias':
        return <AgenciasManager />;
      case 'rutas':
        return <RutasManager />;
      case 'conductores':
        return <ConductoresManager />;
      case 'buses':
        return <BusesManager />;
      case 'asientos':
        return <AsientosManager />;
      case 'viajes':
        return <ViajesManager />;
      case 'usuarios':
        return <UsuariosManager />;
      case 'pasajes':
        return <PasajesManager />;
      default:
        return (
          <div className="flex">
            <div className={`transition-all duration-300 ${selectedDate ? 'w-1/2' : 'w-full'}`}>
              <div className="bg-white rounded-lg shadow p-6 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Calendario de Viajes
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 rounded-full hover:bg-gray-100"
                      disabled={loading}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="font-medium">
                      {currentDate.toLocaleDateString('es-ES', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-2 rounded-full hover:bg-gray-100"
                      disabled={loading}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center font-medium text-gray-500 py-2 text-sm">
                        {day}
                      </div>
                    ))}
                    
                    {renderCalendar().map((week, weekIndex) => (
                      <React.Fragment key={`week-${weekIndex}`}>
                        {week.map((day, dayIndex) => (
                          <div 
                            key={`day-${weekIndex}-${dayIndex}`}
                            onClick={() => day.currentMonth && !loading && handleDateClick(day.date)}
                            className={`p-2 h-16 border rounded-lg flex flex-col ${
                              day.currentMonth 
                                ? selectedDate === day.date 
                                  ? 'bg-orange-100 border-orange-300' 
                                  : 'hover:bg-gray-50 border-gray-200 cursor-pointer'
                                : 'text-gray-400 border-transparent'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-sm ${
                                day.currentMonth ? 'font-medium' : 'font-light'
                              }`}>
                                {day.day}
                              </span>
                              {day.hasViajes && (
                                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                              )}
                            </div>
                            {selectedDate === day.date && (
                              <span className="mt-auto text-xs text-orange-500">Seleccionado</span>
                            )}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {selectedDate && renderViajesDelDia()}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-orange-500 mr-2" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Panel Admin</h2>
                <p className="text-sm text-gray-600">{user?.nombre} {user?.apellido}</p>
              </div>
            </div>
          </div>
          
          <nav className="mt-6">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSelectedDate(null);
                  }}
                  className={`w-full flex items-center px-6 py-3 text-left hover:bg-orange-50 transition-colors ${
                    activeSection === item.id ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' : 'text-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          <div className="absolute bottom-0 w-64 p-6 border-t">
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;