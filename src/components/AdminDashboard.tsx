import React, { useState, useEffect } from 'react';
import {
  Users, Bus, MapPin, Route, UserCheck, Calendar as CalendarIcon,
  LogOut, Settings, BarChart3, ChevronLeft, ChevronRight, Plus, Edit, Trash2
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
  idRutas?: number; // Mantener por consistencia con la API
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
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);

  const [viajeForm, setViajeForm] = useState({
    horaSalida: '',
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

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [viajesResponse, rutasResponse, busesResponse] = await Promise.all([
        ApiService.obtenerViajes(),
        ApiService.obtenerRutas(),
        ApiService.obtenerBuses()
      ]);

      const viajesAdaptados = viajesResponse.map((viaje: any) => ({
        ...viaje,
        idViaje: viaje.idRutas, // Aseguramos que idViaje tenga un valor
      }));

      setViajes(viajesAdaptados);
      setRutas(rutasResponse);
      setBuses(busesResponse.filter((bus: Bus) => bus.idCarro !== undefined && bus.idCarro !== null));
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'dashboard') {
      cargarDatos();
    }
  }, [activeSection]);

  const resetFormulario = () => {
    setEditingViaje(null);
    setShowAddViajeForm(false);
    setViajeForm({ horaSalida: '', costo: '', idRuta: '', idCarro: '' });
  };

  const handleEdit = (viaje: Viaje) => {
    setEditingViaje(viaje);
    setViajeForm({
      horaSalida: viaje.horaSalida.slice(0, 5),
      costo: viaje.costo.toString(),
      idRuta: viaje.idRuta.toString(),
      idCarro: viaje.idCarro?.toString() || '',
    });
    setShowAddViajeForm(true);
  };

  const handleDelete = async (idViaje: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este viaje?')) {
      try {
        setLoading(true);
        await ApiService.eliminarViaje(idViaje);
        // Actualizar el estado para remover el viaje eliminado
        setViajes(prevViajes => prevViajes.filter(v => (v.idViaje || v.idRutas) !== idViaje));
        alert('Viaje eliminado correctamente.');
      } catch (error) {
        console.error('Error al eliminar el viaje:', error);
        alert('Hubo un error al eliminar el viaje.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveViaje = async () => {
    const fechaSalida = editingViaje ? editingViaje.fechaSalida : selectedDate;
    if (!fechaSalida) return;

    if (!viajeForm.horaSalida || !viajeForm.idRuta || !viajeForm.idCarro || !viajeForm.costo) {
      alert('Por favor complete todos los campos del formulario');
      return;
    }

    setLoading(true);

    try {
      const viajeData = {
        horaSalida: viajeForm.horaSalida.includes(':') ? viajeForm.horaSalida : `${viajeForm.horaSalida}:00`,
        fechaSalida: fechaSalida,
        costo: parseFloat(viajeForm.costo),
        idRuta: parseInt(viajeForm.idRuta),
        idCarro: parseInt(viajeForm.idCarro)
      };

      if (editingViaje && editingViaje.idViaje) {
        // Modo Edición
        await ApiService.editarViaje(editingViaje.idViaje, viajeData);
      } else {
        // Modo Creación
        await ApiService.crearViaje(viajeData);
      }

      await cargarDatos(); // Recargar todos los datos para reflejar los cambios
      resetFormulario();

    } catch (error) {
      console.error('Error al guardar el viaje:', error);
      alert('Error al guardar el viaje. Por favor, verifica los datos.');
    } finally {
      setLoading(false);
    }
  };


  // --- Renderizado del Calendario y Componentes ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < startingDay; i++) {
      days.push({
        day: prevMonthDays - startingDay + i + 1,
        currentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - startingDay + i + 1).toISOString().split('T')[0]
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const hasViajes = viajes.some(v => v.fechaSalida === dateStr);
      const isPast = date < today;
      days.push({ day: i, currentMonth: true, date: dateStr, hasViajes, isPast });
    }

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

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
    resetFormulario();
  };

  const formatLocalDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderViajesDelDia = () => {
    if (!selectedDate) return null;

    const viajesDia = viajes.filter(v => v.fechaSalida === selectedDate);

    return (
      <div className="ml-6 flex-1">
        <div className="bg-white rounded-lg shadow p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Viajes para el {formatLocalDate(selectedDate)}</h3>
            {!showAddViajeForm && (
              <button
                onClick={() => { setEditingViaje(null); setShowAddViajeForm(true); }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Viaje
              </button>
            )}
          </div>

          {showAddViajeForm && (
            <div className="mb-6 bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">{editingViaje ? 'Editar Viaje' : 'Agregar Nuevo Viaje'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hora (HH:mm)</label>
                  <input
                    type="time"
                    value={viajeForm.horaSalida}
                    onChange={(e) => setViajeForm({ ...viajeForm, horaSalida: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ruta</label>
                  <select
                    value={viajeForm.idRuta}
                    onChange={(e) => setViajeForm({ ...viajeForm, idRuta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar ruta</option>
                    {rutas.map((ruta) => (
                      <option key={`ruta-${ruta.idRuta}`} value={ruta.idRuta}>{ruta.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bus</label>
                  <select
                    value={viajeForm.idCarro}
                    onChange={(e) => setViajeForm({ ...viajeForm, idCarro: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar bus</option>
                    {buses.map((bus) => (
                      <option key={`bus-${bus.idCarro}`} value={bus.idCarro}>{bus.placa}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Costo (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={viajeForm.costo}
                    onChange={(e) => setViajeForm({ ...viajeForm, costo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button onClick={resetFormulario} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400" disabled={loading}>
                  Cancelar
                </button>
                <button onClick={handleSaveViaje} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Viaje'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : viajesDia.length > 0 ? (
            <div className="space-y-4">
              {viajesDia.map((viaje) => (
                <div key={`viaje-${viaje.idViaje || viaje.idRutas}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <Bus className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="font-semibold">{viaje.busDTO?.placa || 'Bus no asignado'}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1"><span className="font-medium">Ruta:</span> {viaje.rutaDTO?.nombre || 'Ruta no asignada'}</div>
                      <div className="text-sm text-gray-600 mb-1"><span className="font-medium">Hora:</span> {viaje.horaSalida}</div>
                      <div className="text-sm text-gray-600"><span className="font-medium">Costo:</span> S/ {viaje.costo?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleEdit(viaje)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full">
                            <Edit className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(viaje.idViaje || viaje.idRutas!)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full">
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No hay viajes programados para este día</p>
              <button onClick={() => setShowAddViajeForm(true)} className="mt-4 text-orange-500 hover:text-orange-700 font-medium">
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
      case 'administradores': return <AdministradoresManager />;
      case 'agencias': return <AgenciasManager />;
      case 'rutas': return <RutasManager />;
      case 'conductores': return <ConductoresManager />;
      case 'buses': return <BusesManager />;
      case 'asientos': return <AsientosManager />;
      case 'viajes': return <ViajesManager />;
      case 'usuarios': return <UsuariosManager />;
      case 'pasajes': return <PasajesManager />;
      default:
        return (
          <div className="flex">
            <div className={`transition-all duration-300 ${selectedDate ? 'w-1/2' : 'w-full'}`}>
              <div className="bg-white rounded-lg shadow p-6 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Calendario de Viajes</h2>
                  <div className="flex items-center space-x-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100" disabled={loading}>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="font-medium">
                      {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100" disabled={loading}>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {loading && !viajes.length ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div></div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center font-medium text-gray-500 py-2 text-sm">{day}</div>
                    ))}
                    {renderCalendar().map((week, weekIndex) => (
                      <React.Fragment key={`week-${weekIndex}`}>
                        {week.map((day, dayIndex) => {
                          const isSelected = selectedDate === day.date;
                          const isClickable = day.currentMonth && !day.isPast && !loading;
                          return (
                            <div
                              key={`day-${weekIndex}-${dayIndex}`}
                              onClick={() => isClickable && handleDateClick(day.date)}
                              className={`p-2 h-16 border rounded-lg flex flex-col ${day.currentMonth
                                ? isSelected
                                  ? 'bg-orange-100 border-orange-300'
                                  : day.isPast
                                    ? 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'hover:bg-gray-50 border-gray-200 cursor-pointer'
                                : 'text-gray-400 border-transparent'
                                }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`text-sm ${day.currentMonth ? 'font-medium' : 'font-light'}`}>{day.day}</span>
                                {day.hasViajes && <span className="h-2 w-2 rounded-full bg-orange-500"></span>}
                              </div>
                              {isSelected && <span className="mt-auto text-xs text-orange-500">Seleccionado</span>}
                            </div>
                          );
                        })}
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
                  className={`w-full flex items-center px-6 py-3 text-left hover:bg-orange-50 transition-colors ${activeSection === item.id ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' : 'text-gray-600'}`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="absolute bottom-0 w-64 p-6 border-t">
            <button onClick={logout} className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
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