const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {
    this.token = localStorage.getItem('token');
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authRequired: boolean = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      ...(options.headers as { [key: string]: string }),
    };

    if (authRequired && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // ✅ Solución para manejar respuestas 204 No Content
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(credentials: { correo: string; contrasena: string }) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);
  }

  // Usuarios
  async crearUsuario(usuario: any) {
    return this.request<any>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    }, false);
  }

  async obtenerUsuarios() {
    return this.request<any[]>('/usuarios', {}, false);
  }

  async obtenerUsuarioPorDni(dni: string) {
    return this.request<any>(`/usuarios/dni/${dni}`, {}, false);
  }

  async editarUsuario(id: number, usuario: any) {
    return this.request<any>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  }

  async eliminarUsuario(id: number) {
    return this.request<void>(`/usuarios/${id}`, {
      method: 'DELETE'
    });
  }

  // Administradores
  async crearAdministrador(admin: any) {
    return this.request<any>('/administradores', {
      method: 'POST',
      body: JSON.stringify(admin),
    });
  }

  async obtenerAdministradores() {
    return this.request<any[]>('/administradores');
  }

  async editarAdministrador(id: number, admin: any) {
    return this.request<any>(`/administradores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(admin),
    });
  }

  // Agencias
  async crearAgencia(data: any) {
    return this.request<any>('/agencias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async obtenerAgencias() {
    return this.request<any[]>('/agencias');
  }

  async editarAgencia(id: number, agencia: any) {
    return this.request<any>(`/agencias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agencia),
    });
  }

  async eliminarAgencia(id: number) {
    return this.request<void>(`/agencias/${id}`, {
      method: 'DELETE'
    });
  }

  // Rutas
  async crearRuta(ruta: any) {
    return this.request<any>('/rutas', {
      method: 'POST',
      body: JSON.stringify(ruta),
    });
  }

  async obtenerRutas() {
    return this.request<any[]>('/rutas/obtenertodos');
  }

  async obtenerRutaPorId(id: number) {
    return this.request<any>(`/rutas/${id}`);
  }
  async editarRuta(id: number, ruta: any) {
  return this.request<any>(`/rutas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ruta),
  });
}

  async eliminarRuta(id: number) {
    return this.request<void>(`/rutas/${id}`, {
      method: 'DELETE'
    });
  }

  // Conductores
  async crearConductor(data: any) {
    return this.request<any>('/conductores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async obtenerConductores() {
    return this.request<any[]>('/conductores');
  }

  async obtenerConductorPorId(id: number) {
    return this.request<any>(`/conductores/${id}`);
  }

  async editarConductor(id: number, data: any) {
    return this.request<any>(`/conductores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarConductor(id: number) {
    return this.request<void>(`/conductores/${id}`, {
      method: 'DELETE'
    });
  }

  // Buses
  async crearBus(data: any) {
    return this.request<any>('/buses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async obtenerBuses() {
    return this.request<any[]>('/buses');
  }

  async obtenerBusPorId(id: number) {
    return this.request<any>(`/buses/${id}`);
  }

  async obtenerBusPorPlaca(placa: string) {
    return this.request<any>(`/buses/placa/${placa}`);
  }

  async editarBus(id: number, data: any) {
    return this.request<any>(`/buses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarBus(id: number) {
    return this.request<void>(`/buses/${id}`, {
      method: 'DELETE'
    });
  }

  // Asientos
  async crearAsiento(data: any) {
    return this.request<any>('/asientos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async obtenerAsientos() {
    return this.request<any[]>('/asientos');
  }

  async obtenerAsientosPorBus(idBus: number) {
    return this.request<any[]>(`/asientos/bus/${idBus}`);
  }

  async obtenerAsientosDisponibles() {
    return this.request<any[]>('/asientos/disponibles', {}, false);
  }

  async editarAsiento(id: number, data: any) {
    return this.request<any>(`/asientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarAsiento(id: number) {
    return this.request<void>(`/asientos/${id}`, {
      method: 'DELETE'
    });
  }

  // Viajes
  async crearViaje(data: any) {
    console.log('Enviando viaje:', JSON.stringify(data, null, 2));

    return this.request<any>('/viajes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async obtenerViajes() {
    return this.request<any[]>('/viajes');
  }

  async buscarViajes(data: any) {
    return this.request<any[]>('/viajes/buscar', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async editarViaje(id: number, data: any) {
    return this.request<any>(`/viajes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Pasajes
  async crearPasaje(data: any) {
    return this.request<any>('/pasajes', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async obtenerPasajes() {
    return this.request<any[]>('/pasajes', {}, false);
  }

  async obtenerPasajePorId(id: number) {
    return this.request<any>(`/pasajes/${id}`, {}, false);
  }

  async obtenerPasajesPorUsuario(usuarioId: number) {
    return this.request<any[]>(`/pasajes/usuario/${usuarioId}`, {}, false);
  }
}

export default ApiService.getInstance();
