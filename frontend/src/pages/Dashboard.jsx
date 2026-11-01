import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign,
  FiTrendingUp,
  FiShoppingCart,
  FiAlertTriangle,
  FiArrowRight,
} from 'react-icons/fi';
import { getProductosBajoStock, getVentasHoy, getResumenVentas } from '../services/api';

function hoyStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function fechaBonita() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [bajoStock, setBajoStock] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const hoy = hoyStr();
        const [ventasData, bajoStockData] = await Promise.all([
          getVentasHoy(),
          getProductosBajoStock(),
        ]);
        setVentas(ventasData || []);
        setBajoStock(bajoStockData || []);
        try {
          const resumenData = await getResumenVentas(hoy, hoy);
          setResumen(resumenData);
        } catch {
          setResumen(null);
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const totalVendido = resumen?.totalVentas ?? ventas.reduce((s, v) => s + Number(v.total || 0), 0);
  const cantidadVentas = resumen?.cantidadVentas ?? ventas.length;

  // Calculate profit from sales details
  let ganancia = 0;
  let gananciaDisponible = false;
  ventas.forEach((v) => {
    (v.detalles || []).forEach((d) => {
      const pv = d.producto?.precioVenta ?? d.precioUnitario ?? 0;
      const pc = d.producto?.precioCompra ?? 0;
      if (pc > 0) {
        ganancia += d.cantidad * (pv - pc);
        gananciaDisponible = true;
      }
    });
  });
  const ahorro = ganancia * 0.5;

  const fmt = (n) => Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Payment method breakdown
  const porMetodo = {};
  ventas.forEach((v) => {
    const m = v.metodoPago || 'EFECTIVO';
    if (!porMetodo[m]) porMetodo[m] = { count: 0, total: 0 };
    porMetodo[m].count += 1;
    porMetodo[m].total += Number(v.total || 0);
  });

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#8B7355' }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={s.contenedor}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.saludo}>🌸 ¡Buen día!</h1>
        <p style={s.fecha}>{fechaBonita()}</p>
      </div>

      {/* Summary cards */}
      <div style={s.tarjetas}>
        <div style={{ ...s.tarjeta, borderLeft: '5px solid #1B7A5A' }}>
          <div style={{ ...s.tarjetaIcono, background: 'rgba(27,122,90,0.1)' }}>
            <FiDollarSign size={26} color="#1B7A5A" />
          </div>
          <div>
            <p style={s.tarjetaLabel}>Ventas Hoy</p>
            <p style={{ ...s.tarjetaValor, color: '#1B7A5A' }}>{'$' + fmt(totalVendido)}</p>
          </div>
        </div>

        <div style={{ ...s.tarjeta, borderLeft: '5px solid #E07A3A' }}>
          <div style={{ ...s.tarjetaIcono, background: 'rgba(224,122,58,0.1)' }}>
            <FiTrendingUp size={26} color="#E07A3A" />
          </div>
          <div>
            <p style={s.tarjetaLabel}>Ganancia</p>
            <p style={{ ...s.tarjetaValor, color: '#E07A3A' }}>
              {gananciaDisponible ? '$' + fmt(ganancia) : '—'}
            </p>
          </div>
        </div>

        <div style={{ ...s.tarjeta, borderLeft: '5px solid #8B7355' }}>
          <div style={{ ...s.tarjetaIcono, background: 'rgba(139,115,85,0.1)' }}>
            <FiShoppingCart size={26} color="#8B7355" />
          </div>
          <div>
            <p style={s.tarjetaLabel}>Ventas</p>
            <p style={{ ...s.tarjetaValor, color: '#8B7355' }}>{cantidadVentas}</p>
          </div>
        </div>

        {/* Ahorro recomendado */}
        <div style={{
          ...s.tarjeta,
          borderLeft: '5px solid #1B7A5A',
          background: 'linear-gradient(135deg, rgba(27,122,90,0.08), rgba(27,122,90,0.02))',
        }}>
          <div style={{ fontSize: 32 }}>🐷</div>
          <div>
            <p style={s.tarjetaLabel}>Ahorro Recomendado</p>
            <p style={{ ...s.tarjetaValor, color: '#1B7A5A' }}>
              {gananciaDisponible ? '$' + fmt(ahorro) : '—'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#8B7355' }}>50% de ganancia</p>
          </div>
        </div>
      </div>

      {/* Stock bajo */}
      <div style={s.seccion}>
        <h2 style={s.subtitulo}>
          <FiAlertTriangle size={20} color="#E07A3A" /> Alertas de Stock
        </h2>
        {bajoStock.length === 0 ? (
          <div style={{ ...s.alertaOk }}>
            ✅ Todo bien con el stock
          </div>
        ) : (
          <div style={s.alertaGrid}>
            {bajoStock.slice(0, 8).map((p) => (
              <div key={p.id} style={s.alertaCard}>
                <p style={s.alertaNombre}>{p.nombre}</p>
                <p style={{
                  ...s.alertaStock,
                  color: p.stock === 0 ? '#DC2626' : '#E07A3A',
                }}>
                  {p.stock === 0 ? '⛔ AGOTADO' : `⚠️ Quedan ${p.stock}`}
                </p>
                <p style={s.alertaMinimo}>Mínimo: {p.stockMinimo}</p>
              </div>
            ))}
          </div>
        )}
        {bajoStock.length > 0 && (
          <button onClick={() => navigate('/compras')} style={s.botonCompras}>
            <FiArrowRight size={18} /> Ver lista de compras
          </button>
        )}
      </div>

      {/* Corte rapido */}
      <div style={s.seccion}>
        <h2 style={s.subtitulo}>💰 Resumen del Día</h2>
        <div style={s.corteGrid}>
          {[
            { key: 'EFECTIVO', emoji: '💵', label: 'Efectivo', color: '#1B7A5A' },
            { key: 'TARJETA', emoji: '💳', label: 'Tarjeta', color: '#3B82F6' },
            { key: 'FIADO', emoji: '📝', label: 'Fiado', color: '#C96A2E' },
          ].map((m) => (
            <div key={m.key} style={{ ...s.corteCard, borderColor: m.color + '40' }}>
              <span style={{ fontSize: 28 }}>{m.emoji}</span>
              <p style={s.corteLabel}>{m.label}</p>
              <p style={{ ...s.corteTotal, color: m.color }}>
                {'$' + fmt(porMetodo[m.key]?.total || 0)}
              </p>
              <p style={s.corteCantidad}>{porMetodo[m.key]?.count || 0} ventas</p>
            </div>
          ))}
        </div>
        {ventas.length > 0 && (
          <div style={s.corteTotalRow}>
            <span style={{ fontWeight: 700 }}>💰 En caja (efectivo):</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#1B7A5A' }}>
              {'$' + fmt(porMetodo.EFECTIVO?.total || 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  contenedor: {
    padding: '24px',
    maxWidth: '960px',
    margin: '0 auto',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
  },
  header: { marginBottom: 24 },
  saludo: {
    fontSize: 32,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    color: '#2C1810',
    margin: '0 0 4px',
  },
  fecha: {
    fontSize: 16,
    color: '#8B7355',
    margin: 0,
    textTransform: 'capitalize',
  },
  tarjetas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  tarjeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: '#FEFCF9',
    borderRadius: 16,
    boxShadow: '0 1px 3px rgba(44,24,16,0.06)',
  },
  tarjetaIcono: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tarjetaLabel: {
    margin: 0,
    fontSize: 14,
    color: '#8B7355',
    fontWeight: 500,
  },
  tarjetaValor: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
  },
  seccion: { marginBottom: 32 },
  subtitulo: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    color: '#2C1810',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  alertaOk: {
    padding: 24,
    textAlign: 'center',
    fontSize: 18,
    color: '#1B7A5A',
    background: 'rgba(27,122,90,0.06)',
    borderRadius: 16,
    fontWeight: 600,
  },
  alertaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
  },
  alertaCard: {
    padding: '14px 16px',
    background: '#FEF7ED',
    borderRadius: 12,
    border: '1px solid rgba(224,122,58,0.2)',
  },
  alertaNombre: {
    margin: '0 0 4px',
    fontSize: 14,
    fontWeight: 700,
    color: '#2C1810',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  alertaStock: {
    margin: '0 0 2px',
    fontSize: 14,
    fontWeight: 700,
  },
  alertaMinimo: {
    margin: 0,
    fontSize: 12,
    color: '#8B7355',
  },
  botonCompras: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: '12px 24px',
    background: '#1B7A5A',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  corteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  corteCard: {
    padding: 16,
    background: '#FEFCF9',
    borderRadius: 14,
    border: '2px solid',
    textAlign: 'center',
  },
  corteLabel: {
    margin: '8px 0 4px',
    fontSize: 14,
    fontWeight: 700,
  },
  corteTotal: {
    margin: '0 0 2px',
    fontSize: 24,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
  },
  corteCantidad: {
    margin: 0,
    fontSize: 13,
    color: '#8B7355',
  },
  corteTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: '16px 20px',
    background: 'rgba(27,122,90,0.06)',
    borderRadius: 12,
    border: '2px solid rgba(27,122,90,0.15)',
    color: '#2C1810',
    fontSize: 16,
  },
};
