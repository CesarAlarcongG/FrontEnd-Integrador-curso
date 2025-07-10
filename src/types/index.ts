export interface Usuario {
  idUsuario?: number;
  dni: string;
  nombres: string;
  apellidos: string;
  edad: number;
  permisos: string;
}

export interface Administrador {
  idAdministrador?: number;
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
}

export interface Agencia {
  idAgencia?: number;
  departamento: string;
  provincia: string;
  direccion: string;
  referencia: string;
  orden?: number;
}

export interface Ruta {
  idRuta?: number;
  nombre: string;
  idAdministrador: number;
  agenciasIds: number[];
  ordenAgencias: number[];
  agencias?: Agencia[];
}

export interface Conductor {
  idTrabajador?: number;
  nombre: string;
  apellido: string;
  dni: string;
  numeroLicenciaConduccion: string;
}

export interface Bus {
  idBus?: number;
  placa: string;
  idConductor: number;
  conductor?: Conductor;
}

export interface Asiento {
  idAsiento?: number;
  piso: number;
  asiento: string;
  precio: number;
  descripcion: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO';
  idBus: number;
}

export interface Viaje {
  idViaje?: number;
  horaSalida: string;
  fechaSalida: string;
  costo: number;
  idRuta: number;
  idCarro: number;
  ruta?: Ruta;
  bus?: Bus;
}

export interface Pasaje {
  idPasaje?: number;
  fechaCompra?: string;
  precio: number;
  idUsuario: number;
  idViaje: number;
  idAsiento: number;
  usuario?: Usuario;
  viaje?: Viaje;
  asiento?: Asiento;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface BusquedaViaje {
  fecha: string;
  idRuta: number;
}