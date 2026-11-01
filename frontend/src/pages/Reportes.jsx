import { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiCalendar, FiDollarSign, FiShoppingBag, FiEye } from 'react-icons/fi';
import {
  getVentasHoy,
  getVentasSemana,
  getVentasMes,
  getVentasRango,
  getResumenVentas,
} from '../services/api';

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta Semana' },
  { key: 'mes', label: 'Este Mes' },
  { key: 'personalizado', label: 'Personalizado' },
];

function formatFecha(fechaStr) {
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRangoParaPeriodo(periodo) {
  const hoy = new Date();
  const inicio = new Date(hoy);
  const fin = new Date(hoy);

  if (periodo === 'hoy') {
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
  } else if (periodo === 'semana') {
    const day = hoy.getDay();
    inicio.setDate(hoy.getDate() - day);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
  } else if (periodo === 'mes') {
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
  }

  return {
    inicio: inicio.toISOString().split('T')[0],
    fin: fin.toISOString().split('T')[0],
  };
}

const metodoBadge = {
  EFECTIVO: { bg: 'rgba(27,122,90,0.1)', color: '#1B7A5A', label: 'Efectivo' },
  TARJETA: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', label: 'Tarjeta' },
  FIADO: { bg: 'rgba(224,122,58,0.12)', color: '#C96A2E', label: 'Fiado' },
};
function verTicket(venta) {
  const ventanaTicket = window.open('', '_blank', 'width=350,height=600');
  if (!ventanaTicket) {
    alert('Permite las ventanas emergentes para ver el ticket');
    return;
  }

  const detallesHTML = (venta.detalles || []).map((det) => {
    const nombre = det.nombreProducto || det.producto?.nombre || 'Producto';
    const cant = det.cantidad || 0;
    const precio = det.precioUnitario || det.subtotal / det.cantidad || 0;
    const subtotal = det.subtotal || cant * precio;
    return `
      <tr>
        <td style="text-align:left;padding:2px 0;font-size:12px;">${nombre}</td>
        <td style="text-align:center;font-size:12px;">${cant}</td>
        <td style="text-align:right;font-size:12px;">\$${Number(precio).toFixed(2)}</td>
        <td style="text-align:right;font-size:12px;">\$${Number(subtotal).toFixed(2)}</td>
      </tr>`;
  }).join('');

  const fecha = new Date(venta.fechaVenta);
  const fechaStr = fecha.toLocaleDateString('es-MX');
  const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const metodo = venta.metodoPago || 'EFECTIVO';

  const ticketHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Ticket #${venta.id}</title>
    <style>
      body{font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:10px;color:#000;}
      h2{text-align:center;margin:4px 0;font-size:16px;}
      .divider{border-top:1px dashed #000;margin:6px 0;}
      table{width:100%;border-collapse:collapse;}
      th{text-align:left;font-size:11px;border-bottom:1px solid #000;padding:2px 0;}
      .total-row{font-size:16px;font-weight:bold;text-align:right;margin:8px 0;}
      .footer{text-align:center;font-size:11px;margin-top:10px;color:#666;}
      @media print{body{margin:0;padding:5px;}}
    </style></head><body>
    <h2>🌸 Abarrotes Lirios</h2>
    <p style="text-align:center;font-size:11px;margin:2px 0;">Ticket #${venta.id}</p>
    <p style="text-align:center;font-size:11px;margin:2px 0;">${fechaStr} ${horaStr}</p>
    <div class="divider"></div>
    <table>
      <tr><th>Producto</th><th style="text-align:center;">Cant</th><th style="text-align:right;">P.U.</th><th style="text-align:right;">Subt</th></tr>
      ${detallesHTML}
    </table>
    <div class="divider"></div>
    <p class="total-row">TOTAL: \$${Number(venta.total).toFixed(2)}</p>
    <p style="text-align:right;font-size:12px;margin:2px 0;">Pago: ${metodo}</p>
    <div class="divider"></div>
    <p class="footer">¡Gracias por su compra!<br>Vuelva pronto 🌺</p>
  </body></html>`;

  ventanaTicket.document.write(ticketHTML);
  ventanaTicket.document.close();
  setTimeout(() => {
    try { ventanaTicket.print(); } catch (e) { /* user can print manually */ }
  }, 400);
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState('hoy');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [expandida, setExpandida] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      let ventasData;
      let rango;

      if (periodo === 'hoy') {
        ventasData = await getVentasHoy();
        rango = getRangoParaPeriodo('hoy');
      } else if (periodo === 'semana') {
        ventasData = await getVentasSemana();
        rango = getRangoParaPeriodo('semana');
      } else if (periodo === 'mes') {
        ventasData = await getVentasMes();
        rango = getRangoParaPeriodo('mes');
      } else if (periodo === 'personalizado' && fechaInicio && fechaFin) {
        ventasData = await getVentasRango(fechaInicio, fechaFin);
        rango = { inicio: fechaInicio, fin: fechaFin };
      } else {
        setCargando(false);
        return;
      }

      setVentas(ventasData || []);
      const resumenData = await getResumenVentas(rango.inicio, rango.fin);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setCargando(false);
    }
  }, [periodo, fechaInicio, fechaFin]);

  useEffect(() => {
    if (periodo !== 'personalizado') {
      cargarDatos();
    }
  }, [periodo, cargarDatos]);

  const totalVentas = resumen?.totalVentas ?? 0;
  const cantidadVentas = resumen?.cantidadVentas ?? 0;
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;
  const productosMasVendidos = resumen?.productosMasVendidos ?? [];
  const maxCantidad = productosMasVendidos.length > 0
    ? Math.max(...productosMasVendidos.map((p) => p[2]))
    : 1;

  return (
    <div style={estilos.contenedor}>
      {/* Titulo */}
      <div style={estilos.encabezado}>
        <FiTrendingUp size={28} style={{ color: '#1B7A5A' }} />
        <h1 style={estilos.titulo}>Reportes de Ventas</h1>
      </div>

      {/* Tabs de periodo */}
      <div style={estilos.tabs}>
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            style={{
              ...estilos.tab,
              ...(periodo === p.key ? estilos.tabActivo : {}),
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Rango personalizado */}
      {periodo === 'personalizado' && (
        <div style={estilos.rangoPersonalizado}>
          <div style={estilos.campoFecha}>
            <label style={estilos.labelFecha}>Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={estilos.inputFecha}
            />
          </div>
          <div style={estilos.campoFecha}>
            <label style={estilos.labelFecha}>Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={estilos.inputFecha}
            />
          </div>
          <button
            onClick={cargarDatos}
            disabled={!fechaInicio || !fechaFin}
            style={{
              ...estilos.botonBuscar,
              opacity: !fechaInicio || !fechaFin ? 0.5 : 1,
            }}
          >
            <FiCalendar size={18} />
            Buscar
          </button>
        </div>
      )}

      {cargando && <p style={estilos.cargando}>Cargando datos...</p>}

      {/* Tarjetas resumen */}
      <div style={estilos.tarjetas}>
        <div style={{ ...estilos.tarjeta, borderLeft: '5px solid #1B7A5A' }}>
          <div style={estilos.tarjetaIcono}>
            <FiDollarSign size={24} color="#1B7A5A" />
          </div>
          <div>
            <p style={estilos.tarjetaLabel}>Total Vendido</p>
            <p style={{ ...estilos.tarjetaValor, color: '#1B7A5A' }}>
              ${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div style={{ ...estilos.tarjeta, borderLeft: '5px solid #E07A3A' }}>
          <div style={estilos.tarjetaIcono}>
            <FiShoppingBag size={24} color="#E07A3A" />
          </div>
          <div>
            <p style={estilos.tarjetaLabel}>Numero de Ventas</p>
            <p style={{ ...estilos.tarjetaValor, color: '#E07A3A' }}>
              {cantidadVentas}
            </p>
          </div>
        </div>

        <div style={{ ...estilos.tarjeta, borderLeft: '5px solid #8B7355' }}>
          <div style={estilos.tarjetaIcono}>
            <FiTrendingUp size={24} color="#8B7355" />
          </div>
          <div>
            <p style={estilos.tarjetaLabel}>Ticket Promedio</p>
            <p style={{ ...estilos.tarjetaValor, color: '#8B7355' }}>
              ${ticketPromedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Productos mas vendidos */}
      <div style={estilos.seccion}>
        <h2 style={estilos.subtitulo}>Productos Mas Vendidos</h2>
        {productosMasVendidos.length === 0 ? (
          <p style={estilos.sinDatos}>No hay datos para este periodo</p>
        ) : (
          <div style={estilos.barrasContenedor}>
            {productosMasVendidos.slice(0, 10).map((producto) => {
              const [id, nombre, cantidad] = producto;
              const porcentaje = (cantidad / maxCantidad) * 100;
              return (
                <div key={id} style={estilos.barraFila}>
                  <span style={estilos.barraNombre}>{nombre}</span>
                  <div style={estilos.barraFondo}>
                    <div
                      style={{
                        ...estilos.barraRelleno,
                        width: `${porcentaje}%`,
                      }}
                    />
                  </div>
                  <span style={estilos.barraCantidad}>{cantidad}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de ventas */}
      <div style={estilos.seccion}>
        <h2 style={estilos.subtitulo}>Historial de Ventas</h2>
        {ventas.length === 0 ? (
          <p style={estilos.sinDatos}>No hay ventas en este periodo</p>
        ) : (
          <div style={estilos.tabla}>
            {/* Encabezados */}
            <div style={estilos.tablaEncabezado}>
              <span style={{ ...estilos.tablaCelda, flex: 2 }}>Fecha / Hora</span>
              <span style={{ ...estilos.tablaCelda, flex: 1, textAlign: 'center' }}># Productos</span>
              <span style={{ ...estilos.tablaCelda, flex: 1, textAlign: 'center' }}>Metodo Pago</span>
              <span style={{ ...estilos.tablaCelda, flex: 1, textAlign: 'right' }}>Total</span>
              <span style={{ ...estilos.tablaCelda, flex: 0.5, textAlign: 'center' }}>Ticket</span>
            </div>

            {ventas.map((venta) => {
              const metodo = metodoBadge[venta.metodoPago] || metodoBadge.EFECTIVO;
              const estaExpandida = expandida === venta.id;
              return (
                <div key={venta.id}>
                  <div
                    style={{
                      ...estilos.tablaFila,
                      cursor: 'pointer',
                      background: estaExpandida ? 'rgba(27,122,90,0.05)' : 'transparent',
                    }}
                    onClick={() => setExpandida(estaExpandida ? null : venta.id)}
                  >
                    <span style={{ ...estilos.tablaCelda, flex: 2 }}>
                      {formatFecha(venta.fechaVenta)}
                    </span>
                    <span style={{ ...estilos.tablaCelda, flex: 1, textAlign: 'center' }}>
                      {venta.detalles?.length ?? 0}
                    </span>
                    <span style={{ ...estilos.tablaCelda, flex: 1, textAlign: 'center' }}>
                      <span
                        style={{
                          ...estilos.badge,
                          backgroundColor: metodo.bg,
                          color: metodo.color,
                        }}
                      >
                        {metodo.label}
                      </span>
                    </span>
                    <span style={{ ...estilos.tablaCelda, flex: 1, textAlign: 'right', fontWeight: 700 }}>
                      ${venta.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ ...estilos.tablaCelda, flex: 0.5, textAlign: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); verTicket(venta); }}
                        style={estilos.botonOjito}
                        title="Ver ticket"
                      >
                        <FiEye size={18} />
                      </button>
                    </span>
                  </div>

                  {/* Detalles expandibles */}
                  {estaExpandida && venta.detalles && (
                    <div style={estilos.detalles}>
                      <p style={estilos.detallesTitulo}>Detalles de la venta:</p>
                      {venta.detalles.map((det, idx) => (
                        <div key={idx} style={estilos.detalleFila}>
                          <span>{det.nombreProducto || det.producto?.nombre || `Producto #${det.productoId}`}</span>
                          <span>x{det.cantidad}</span>
                          <span>${det.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const estilos = {
  contenedor: {
    padding: '24px',
    maxWidth: '960px',
    margin: '0 auto',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
  },
  encabezado: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    margin: 0,
    color: 'var(--text, #2C1810)',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    border: '2px solid var(--border, #F0E6D8)',
    borderRadius: '12px',
    background: 'var(--card, #FEFCF9)',
    color: 'var(--text-light, #8B7355)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActivo: {
    background: 'var(--primary, #1B7A5A)',
    color: '#fff',
    borderColor: 'var(--primary, #1B7A5A)',
  },
  rangoPersonalizado: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    marginBottom: '20px',
    flexWrap: 'wrap',
    padding: '16px',
    background: 'var(--bg-warm, #FEF7ED)',
    borderRadius: '12px',
    border: '1px solid var(--border, #F0E6D8)',
  },
  campoFecha: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  labelFecha: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-light, #8B7355)',
  },
  inputFecha: {
    padding: '10px 14px',
    fontSize: '16px',
    border: '2px solid var(--border, #F0E6D8)',
    borderRadius: '10px',
    outline: 'none',
    background: 'var(--card, #FEFCF9)',
    color: 'var(--text, #2C1810)',
  },
  botonBuscar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    background: 'var(--primary, #1B7A5A)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  cargando: {
    textAlign: 'center',
    color: 'var(--text-light, #8B7355)',
    fontSize: '16px',
    padding: '20px',
  },
  tarjetas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  tarjeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'var(--card, #FEFCF9)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow, 0 1px 3px rgba(44,24,16,0.06))',
  },
  tarjetaIcono: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--bg-warm, #FEF7ED)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaLabel: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-light, #8B7355)',
    fontWeight: 500,
  },
  tarjetaValor: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
  },
  seccion: {
    marginBottom: '32px',
  },
  subtitulo: {
    fontSize: '20px',
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    color: 'var(--text, #2C1810)',
    marginBottom: '16px',
  },
  sinDatos: {
    color: 'var(--text-placeholder, #B8A089)',
    fontSize: '16px',
    textAlign: 'center',
    padding: '32px',
  },
  barrasContenedor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  barraFila: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barraNombre: {
    width: '140px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text, #2C1810)',
    textAlign: 'right',
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  barraFondo: {
    flex: 1,
    height: '28px',
    background: 'var(--border, #F0E6D8)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    background: 'linear-gradient(90deg, #22956E, #1B7A5A)',
    borderRadius: '8px',
    transition: 'width 0.5s ease',
    minWidth: '4px',
  },
  barraCantidad: {
    width: '50px',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text, #2C1810)',
    textAlign: 'right',
    flexShrink: 0,
  },
  tabla: {
    background: 'var(--card, #FEFCF9)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow, 0 1px 3px rgba(44,24,16,0.06))',
  },
  tablaEncabezado: {
    display: 'flex',
    padding: '14px 16px',
    background: 'var(--bg-warm, #FEF7ED)',
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--text-light, #8B7355)',
    borderBottom: '2px solid var(--border, #F0E6D8)',
  },
  tablaFila: {
    display: 'flex',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border, #F0E6D8)',
    alignItems: 'center',
    fontSize: '15px',
    transition: 'background 0.15s',
  },
  tablaCelda: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700,
  },
  detalles: {
    padding: '12px 24px 16px',
    background: 'var(--bg-warm, #FEF7ED)',
    borderBottom: '1px solid var(--border, #F0E6D8)',
  },
  detallesTitulo: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-light, #8B7355)',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  detalleFila: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '14px',
    color: 'var(--text, #2C1810)',
  },
  botonOjito: {
    background: 'none',
    border: '2px solid rgba(27,122,90,0.3)',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    color: '#1B7A5A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
};
