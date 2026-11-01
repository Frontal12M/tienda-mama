import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ INTERCEPTORES JWT ============

// Agregar token a cada request
api.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('tienda_user');
    if (saved) {
      const { token } = JSON.parse(saved);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignorar error de localStorage
  }
  return config;
});

// Si el servidor responde 401/403, cerrar sesion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // No redirigir si es la ruta de login
      if (!error.config.url.includes('/auth/')) {
        localStorage.removeItem('tienda_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTENTICACION ============

export async function loginAPI(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

export async function registroAPI(userData) {
  const { data } = await api.post('/auth/registro', userData);
  return data;
}

// ============ PRODUCTOS ============

export async function getProductos() {
  const { data } = await api.get('/productos');
  return data;
}

export async function getProducto(id) {
  const { data } = await api.get(`/productos/${id}`);
  return data;
}

export async function getProductoPorCodigo(codigo) {
  const { data } = await api.get(`/productos/barcode/${codigo}`);
  return data;
}

export async function buscarProductos(nombre) {
  const { data } = await api.get('/productos/buscar', { params: { nombre } });
  return data;
}

export async function getProductosPorCategoria(categoriaId) {
  const { data } = await api.get(`/productos/categoria/${categoriaId}`);
  return data;
}

export async function getProductosBajoStock() {
  const { data } = await api.get('/productos/bajo-stock');
  return data;
}

export async function getListaCompras() {
  const { data } = await api.get('/productos/lista-compras');
  return data;
}

export async function crearProducto(productoData) {
  const { data } = await api.post('/productos', productoData);
  return data;
}

export async function actualizarProducto(id, productoData) {
  const { data } = await api.put(`/productos/${id}`, productoData);
  return data;
}

export async function actualizarStock(id, cantidad) {
  const { data } = await api.patch(`/productos/${id}/stock?cantidad=${cantidad}`);
  return data;
}

export async function eliminarProducto(id) {
  const { data } = await api.delete(`/productos/${id}`);
  return data;
}

// ============ CATEGORIAS ============

export async function getCategorias() {
  const { data } = await api.get('/categorias');
  return data;
}

export async function crearCategoria(categoriaData) {
  const { data } = await api.post('/categorias', categoriaData);
  return data;
}

// ============ VENTAS ============

export async function registrarVenta(ventaData) {
  const { data } = await api.post('/ventas', ventaData);
  return data;
}

export async function getVenta(id) {
  const { data } = await api.get(`/ventas/${id}`);
  return data;
}

export async function getVentasHoy() {
  const { data } = await api.get('/ventas/hoy');
  return data;
}

export async function getVentasSemana() {
  const { data } = await api.get('/ventas/semana');
  return data;
}

export async function getVentasMes() {
  const { data } = await api.get('/ventas/mes');
  return data;
}

export async function getVentasRango(inicio, fin) {
  const { data } = await api.get('/ventas/rango', { params: { inicio, fin } });
  return data;
}

export async function getResumenVentas(inicio, fin) {
  const { data } = await api.get('/ventas/resumen', { params: { inicio, fin } });
  return data;
}

export async function getCorteDeCaja(inicio, fin) {
  const { data } = await api.get('/ventas/corte', { params: { inicio, fin } });
  return data;
}


// ============ CLIENTES ============

export async function getClientes() {
  const { data } = await api.get('/clientes');
  return data;
}

export async function getCliente(id) {
  const { data } = await api.get(`/clientes/${id}`);
  return data;
}

export async function buscarClientes(nombre) {
  const { data } = await api.get('/clientes/buscar', { params: { nombre } });
  return data;
}

export async function crearCliente(clienteData) {
  const { data } = await api.post('/clientes', clienteData);
  return data;
}

export async function actualizarCliente(id, clienteData) {
  const { data } = await api.put(`/clientes/${id}`, clienteData);
  return data;
}

export async function eliminarCliente(id) {
  const { data } = await api.delete(`/clientes/${id}`);
  return data;
}

export async function getSaldoCliente(id) {
  const { data } = await api.get(`/clientes/${id}/saldo`);
  return data;
}

// ============ FIADOS ============

export async function getFiados() {
  const { data } = await api.get('/fiados');
  return data;
}

export async function getFiadosPendientes() {
  const { data } = await api.get('/fiados/pendientes');
  return data;
}

export async function getFiadosPorCliente(clienteId) {
  const { data } = await api.get(`/fiados/cliente/${clienteId}`);
  return data;
}

export async function registrarPago(fiadoId, monto) {
  const { data } = await api.post(`/fiados/${fiadoId}/pago`, { monto });
  return data;
}

export default api;
