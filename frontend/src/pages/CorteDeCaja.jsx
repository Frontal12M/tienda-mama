import { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiPrinter, FiCalendar, FiCreditCard, FiTrendingUp, FiShoppingBag } from 'react-icons/fi';
import { getCorteDeCaja, getVentasHoy } from '../services/api';

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}







const METODO_CONFIG = {
  EFECTIVO: { emoji: '💵', label: 'Efectivo', bg: 'rgba(27,122,90,0.08)', border: 'rgba(27,122,90,0.25)', color: '#1B7A5A' },
  TARJETA: { emoji: '💳', label: 'Tarjeta', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', color: '#3B82F6' },
  FIADO: { emoji: '📝', label: 'Fiado', bg: 'rgba(224,122,58,0.08)', border: 'rgba(224,122,58,0.25)', color: '#C96A2E' },
};

export default function CorteDeCaja() {
  const [fecha, setFecha] = useState(todayStr());
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await getCorteDeCaja(fecha, fecha);
      setDatos(res);
    } catch {
      // Fallback: calculate from today's sales
      try {
        const ventas = await getVentasHoy();
        const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0);
        const cantidadVentas = ventas.length;

        // Calculate profit from detalles if available
        let ganancia = 0;
        for (const v of ventas) {
          if (v.detalles) {
            for (const d of v.detalles) {
              const pv = Number(d.producto?.precioVenta || d.precioUnitario || 0);
              const pc = Number(d.producto?.precioCompra || 0);
              ganancia += (pv - pc) * (d.cantidad || 0);
            }
          }
        }

        const porMetodo = {};
        for (const v of ventas) {
          const m = v.metodoPago || 'EFECTIVO';
          if (!porMetodo[m]) porMetodo[m] = { cantidad: 0, total: 0 };
          porMetodo[m].cantidad++;
          porMetodo[m].total += Number(v.total) || 0;
        }

        const porMetodoPago = Object.entries(porMetodo).map(([metodo, d]) => [metodo, d.cantidad, d.total]);

        setDatos({
          totalVentas,
          cantidadVentas,
          ganancia,
          recomendacionAhorro: ganancia * 0.5,
          porMetodoPago,
        });
      } catch (e2) {
        console.error('Error cargando corte:', e2);
      }
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalVentas = datos?.totalVentas ?? 0;
  const cantidadVentas = datos?.cantidadVentas ?? 0;
  const ganancia = datos?.ganancia ?? 0;
  const ahorro = datos?.recomendacionAhorro ?? 0;
  const porMetodo = datos?.porMetodoPago ?? [];

  function getMetodo(nombre) {
    const found = porMetodo.find((m) => m[0] === nombre);
    return found ? { cantidad: found[1], total: found[2] } : { cantidad: 0, total: 0 };
  }

  const efectivo = getMetodo('EFECTIVO');
  const tarjeta = getMetodo('TARJETA');
  const fiado = getMetodo('FIADO');

  function fmt(n) {
    return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function imprimirCorte() {
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) { alert('Permite las ventanas emergentes'); return; }

    const fechaDisplay = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Corte de Caja</title>
      <style>
        body{font-family:'Courier New',monospace;width:320px;margin:0 auto;padding:15px;color:#000;}
        h2{text-align:center;margin:4px 0;font-size:18px;}
        .divider{border-top:1px dashed #000;margin:8px 0;}
        .row{display:flex;justify-content:space-between;padding:3px 0;font-size:13px;}
        .row.bold{font-weight:bold;font-size:14px;}
        .section{margin:8px 0;font-size:14px;font-weight:bold;}
        .footer{text-align:center;font-size:11px;margin-top:12px;color:#666;}
        .highlight{background:#f0f0f0;padding:8px;border-radius:4px;margin:6px 0;}
        @media print{body{margin:0;padding:5px;}}
      </style></head><body>
      <h2>🌸 Abarrotes Lirios</h2>
      <p style="text-align:center;font-size:12px;margin:2px 0;">CORTE DE CAJA</p>
      <p style="text-align:center;font-size:11px;margin:2px 0;">${fechaDisplay}</p>
      <div class="divider"></div>

      <p class="section">Resumen General</p>
      <div class="row bold"><span>Total Vendido:</span><span>$${fmt(totalVentas)}</span></div>
      <div class="row"><span>Número de Ventas:</span><span>${cantidadVentas}</span></div>
      <div class="row bold"><span>Ganancia:</span><span>$${fmt(ganancia)}</span></div>
      <div class="divider"></div>

      <p class="section">Por Método de Pago</p>
      <div class="row"><span>💵 Efectivo (${efectivo.cantidad}):</span><span>$${fmt(efectivo.total)}</span></div>
      <div class="row"><span>💳 Tarjeta (${tarjeta.cantidad}):</span><span>$${fmt(tarjeta.total)}</span></div>
      <div class="row"><span>📝 Fiado (${fiado.cantidad}):</span><span>$${fmt(fiado.total)}</span></div>
      <div class="divider"></div>

      <div class="highlight">
        <div class="row bold"><span>En caja debe haber:</span><span>$${fmt(efectivo.total)}</span></div>
        <div class="row"><span>En tarjeta se cobró:</span><span>$${fmt(tarjeta.total)}</span></div>
        <div class="row"><span>Se fió:</span><span>$${fmt(fiado.total)}</span></div>
      </div>
      <div class="divider"></div>

      <div class="highlight">
        <div class="row bold"><span>💡 Ahorro recomendado:</span><span>$${fmt(ahorro)}</span></div>
      </div>

      <p class="footer">Generado el ${new Date().toLocaleString('es-MX')}</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => { try { w.print(); } catch(e) {} }, 400);
  }

  return (
    <div style={st.contenedor}>
      {/* Header */}
      <div style={st.encabezado}>
        <FiDollarSign size={28} style={{ color: '#1B7A5A' }} />
        <h1 style={st.titulo}>Corte de Caja</h1>
      </div>

      {/* Date picker */}
      <div style={st.fechaRow}>
        <FiCalendar size={20} color="#8B7355" />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={st.inputFecha}
        />
        <button onClick={imprimirCorte} style={st.botonImprimir}>
          <FiPrinter size={18} />
          Imprimir Corte
        </button>
      </div>

      {cargando && <p style={st.cargando}>Cargando datos...</p>}

      {/* Summary cards */}
      <div style={st.tarjetas}>
        <div style={{ ...st.tarjeta, borderLeft: '5px solid #1B7A5A' }}>
          <div style={st.tarjetaIcono}><FiDollarSign size={24} color="#1B7A5A" /></div>
          <div>
            <p style={st.tarjetaLabel}>Total Vendido</p>
            <p style={{ ...st.tarjetaValor, color: '#1B7A5A' }}>${fmt(totalVentas)}</p>
          </div>
        </div>

        <div style={{ ...st.tarjeta, borderLeft: '5px solid #E07A3A' }}>
          <div style={st.tarjetaIcono}><FiTrendingUp size={24} color="#E07A3A" /></div>
          <div>
            <p style={st.tarjetaLabel}>Ganancia del Día</p>
            <p style={{ ...st.tarjetaValor, color: '#E07A3A' }}>${fmt(ganancia)}</p>
          </div>
        </div>

        <div style={{ ...st.tarjeta, borderLeft: '5px solid #8B7355' }}>
          <div style={st.tarjetaIcono}><FiShoppingBag size={24} color="#8B7355" /></div>
          <div>
            <p style={st.tarjetaLabel}>Número de Ventas</p>
            <p style={{ ...st.tarjetaValor, color: '#8B7355' }}>{cantidadVentas}</p>
          </div>
        </div>

        <div style={{ ...st.tarjeta, borderLeft: '5px solid #22956E', background: 'rgba(27,122,90,0.06)' }}>
          <div style={{ ...st.tarjetaIcono, background: 'rgba(27,122,90,0.15)' }}>
            <span style={{ fontSize: 22 }}>🐷</span>
          </div>
          <div>
            <p style={st.tarjetaLabel}>Ahorro Recomendado</p>
            <p style={{ ...st.tarjetaValor, color: '#1B7A5A' }}>${fmt(ahorro)}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#22956E', fontWeight: 600 }}>50% de tu ganancia</p>
          </div>
        </div>
      </div>

      {/* Desglose por Método de Pago */}
      <div style={st.seccion}>
        <h2 style={st.subtitulo}>Desglose por Método de Pago</h2>
        <div style={st.metodoGrid}>
          {Object.entries(METODO_CONFIG).map(([key, cfg]) => {
            const m = getMetodo(key);
            return (
              <div key={key} style={{ ...st.metodoCard, background: cfg.bg, border: `2px solid ${cfg.border}` }}>
                <span style={{ fontSize: 32 }}>{cfg.emoji}</span>
                <p style={{ ...st.metodoLabel, color: cfg.color }}>{cfg.label}</p>
                <p style={{ ...st.metodoTotal, color: cfg.color }}>${fmt(m.total)}</p>
                <p style={st.metodoCount}>{m.cantidad} {m.cantidad === 1 ? 'venta' : 'ventas'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen para la Caja */}
      <div style={st.seccion}>
        <h2 style={st.subtitulo}>Resumen para la Caja</h2>
        <div style={st.resumenCaja}>
          <div style={st.resumenRow}>
            <span style={st.resumenLabel}>💵 En caja debe haber:</span>
            <span style={{ ...st.resumenValor, color: '#1B7A5A' }}>${fmt(efectivo.total)}</span>
          </div>
          <div style={{ ...st.resumenDivider }} />
          <div style={st.resumenRow}>
            <span style={st.resumenLabel}>💳 En tarjeta se cobró:</span>
            <span style={{ ...st.resumenValor, color: '#3B82F6' }}>${fmt(tarjeta.total)}</span>
          </div>
          <div style={{ ...st.resumenDivider }} />
          <div style={st.resumenRow}>
            <span style={st.resumenLabel}>📝 Se fió:</span>
            <span style={{ ...st.resumenValor, color: '#C96A2E' }}>${fmt(fiado.total)}</span>
          </div>
          <div style={{ ...st.resumenDivider }} />
          <div style={{ ...st.resumenRow, background: 'rgba(27,122,90,0.06)', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
            <span style={{ ...st.resumenLabel, fontWeight: 800, color: '#1B7A5A' }}>💰 Total del día:</span>
            <span style={{ ...st.resumenValor, color: '#1B7A5A', fontSize: 24 }}>${fmt(totalVentas)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const st = {
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
    marginBottom: '20px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    margin: 0,
    color: 'var(--text, #2C1810)',
  },
  fechaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  inputFecha: {
    padding: '10px 14px',
    fontSize: '16px',
    border: '2px solid var(--border, #F0E6D8)',
    borderRadius: '10px',
    outline: 'none',
    background: 'var(--card, #FEFCF9)',
    color: 'var(--text, #2C1810)',
    fontWeight: 600,
  },
  botonImprimir: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: 700,
    background: 'var(--primary, #1B7A5A)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  cargando: {
    textAlign: 'center',
    color: 'var(--text-light, #8B7355)',
    fontSize: '16px',
    padding: '20px',
  },
  tarjetas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginBottom: '32px',
  },
  tarjeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '18px',
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
    flexShrink: 0,
  },
  tarjetaLabel: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-light, #8B7355)',
    fontWeight: 500,
  },
  tarjetaValor: {
    margin: 0,
    fontSize: '24px',
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
  metodoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  metodoCard: {
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(44,24,16,0.04)',
  },
  metodoLabel: {
    margin: '8px 0 4px',
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
  },
  metodoTotal: {
    margin: '0 0 4px',
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
  },
  metodoCount: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-light, #8B7355)',
    fontWeight: 600,
  },
  resumenCaja: {
    background: 'var(--card, #FEFCF9)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: 'var(--shadow, 0 1px 3px rgba(44,24,16,0.06))',
    border: '2px solid var(--border, #F0E6D8)',
  },
  resumenRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 4px',
  },
  resumenLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text, #2C1810)',
  },
  resumenValor: {
    fontSize: '20px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
  },
  resumenDivider: {
    borderTop: '1px solid var(--border, #F0E6D8)',
    margin: '0 4px',
  },
};
