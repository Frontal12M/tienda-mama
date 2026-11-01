import { useState, useEffect } from 'react';
import {
  FiShoppingBag,
  FiPrinter,
  FiRefreshCw,
  FiPlus,
  FiMinus,
  FiCheck,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi';
import { getListaCompras } from '../services/api';

const getNextSunday = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + diff);
  return sunday.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ListaCompras() {
  const [items, setItems] = useState([]);
  const [marcados, setMarcados] = useState({});
  const [cargando, setCargando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState(1);

  const cargarLista = async () => {
    setCargando(true);
    try {
      const data = await getListaCompras();
      const itemsConId = (data || []).map((item, idx) => ({
        ...item,
        _id: item.productoId || `api-${idx}`,
        _manual: false,
      }));
      setItems(itemsConId);
    } catch (error) {
      console.error('Error cargando lista de compras:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLista();
  }, []);

  const toggleMarcado = (id) => {
    setMarcados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const ajustarCantidad = (id, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._id !== id) return item;
        const nueva = Math.max(1, (item.cantidadSugerida || 1) + delta);
        return { ...item, cantidadSugerida: nueva };
      })
    );
  };

  const agregarItem = () => {
    if (!nuevoNombre.trim()) return;
    const nuevoItem = {
      _id: `manual-${Date.now()}`,
      _manual: true,
      productoId: null,
      nombre: nuevoNombre.trim(),
      stockActual: 0,
      stockMinimo: 0,
      cantidadSugerida: nuevaCantidad,
      precioCompra: 0,
      costoEstimado: 0,
    };
    setItems((prev) => [...prev, nuevoItem]);
    setNuevoNombre('');
    setNuevaCantidad(1);
  };

  const costoTotal = items.reduce((sum, item) => {
    const costo = item.precioCompra
      ? item.precioCompra * (item.cantidadSugerida || 1)
      : item.costoEstimado || 0;
    return sum + costo;
  }, 0);

  return (
    <div style={estilos.contenedor}>
      {/* Estilos de impresion */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #lista-compras-print, #lista-compras-print * { visibility: visible; }
          #lista-compras-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print { display: none !important; }
          .print-header { display: block !important; }
        }
      `}</style>

      <div id="lista-compras-print">
        {/* Header de impresion (oculto en pantalla) */}
        <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Abarrotes Lirios</h1>
          <p style={{ margin: '4px 0', color: '#555' }}>Lista de Compras - {getNextSunday()}</p>
        </div>

        {/* Encabezado */}
        <div style={estilos.encabezado} className="no-print">
          <div>
            <div style={estilos.tituloFila}>
              <FiShoppingBag size={28} style={{ color: '#1B7A5A' }} />
              <h1 style={estilos.titulo}>Lista de Compras - Domingo</h1>
            </div>
            <p style={estilos.subtitulo}>{getNextSunday()}</p>
          </div>
        </div>

        {/* Botones de accion */}
        <div style={estilos.botones} className="no-print">
          <button onClick={cargarLista} style={estilos.botonGenerar} disabled={cargando}>
            <FiRefreshCw size={20} style={cargando ? { animation: 'spin 1s linear infinite' } : {}} />
            {cargando ? 'Cargando...' : 'Generar Lista'}
          </button>
          <button onClick={() => window.print()} style={estilos.botonImprimir}>
            <FiPrinter size={20} />
            Imprimir Lista
          </button>
        </div>

        {/* Agregar item manual */}
        <div style={estilos.agregarContenedor} className="no-print">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarItem()}
            placeholder="Agregar producto..."
            style={estilos.inputAgregar}
          />
          <div style={estilos.cantidadControl}>
            <button
              onClick={() => setNuevaCantidad(Math.max(1, nuevaCantidad - 1))}
              style={estilos.botonCantidad}
            >
              <FiMinus size={16} />
            </button>
            <span style={estilos.cantidadTexto}>{nuevaCantidad}</span>
            <button
              onClick={() => setNuevaCantidad(nuevaCantidad + 1)}
              style={estilos.botonCantidad}
            >
              <FiPlus size={16} />
            </button>
          </div>
          <button onClick={agregarItem} style={estilos.botonAgregar}>
            <FiPlus size={20} />
            Agregar
          </button>
        </div>

        {/* Lista de productos */}
        {items.length === 0 && !cargando ? (
          <p style={estilos.sinDatos}>
            No hay productos por comprar. Presiona "Generar Lista" para actualizar.
          </p>
        ) : (
          <div style={estilos.lista}>
            {items.map((item) => {
              const estaMarcado = marcados[item._id];
              const costoItem = item.precioCompra
                ? item.precioCompra * (item.cantidadSugerida || 1)
                : item.costoEstimado || 0;

              return (
                <div
                  key={item._id}
                  style={{
                    ...estilos.itemFila,
                    opacity: estaMarcado ? 0.5 : 1,
                    background: estaMarcado ? 'rgba(27,122,90,0.06)' : 'var(--card)',
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleMarcado(item._id)}
                    style={estilos.checkbox}
                    className="no-print"
                  >
                    {estaMarcado ? (
                      <FiCheckSquare size={24} color="#1B7A5A" />
                    ) : (
                      <FiSquare size={24} color="#B8A089" />
                    )}
                  </button>

                  {/* Checkbox para impresion */}
                  <span style={{ ...estilos.printCheckbox, display: 'none' }} className="print-show">
                    {estaMarcado ? <FiCheck size={16} /> : '[ ]'}
                  </span>

                  {/* Info del producto */}
                  <div style={estilos.itemInfo}>
                    <span
                      style={{
                        ...estilos.itemNombre,
                        textDecoration: estaMarcado ? 'line-through' : 'none',
                      }}
                    >
                      {item.nombre}
                      {item._manual && (
                        <span style={estilos.badgeManual}>Manual</span>
                      )}
                    </span>
                    {!item._manual && (
                      <span style={estilos.itemStock}>
                        Stock actual: {item.stockActual} / Min: {item.stockMinimo}
                      </span>
                    )}
                  </div>

                  {/* Controles de cantidad */}
                  <div style={estilos.cantidadControlItem} className="no-print">
                    <button
                      onClick={() => ajustarCantidad(item._id, -1)}
                      style={estilos.botonCantidadPeq}
                    >
                      <FiMinus size={14} />
                    </button>
                    <span style={estilos.cantidadItem}>{item.cantidadSugerida || 1}</span>
                    <button
                      onClick={() => ajustarCantidad(item._id, 1)}
                      style={estilos.botonCantidadPeq}
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>

                  {/* Costo */}
                  <span style={estilos.itemCosto}>
                    {costoItem > 0
                      ? `$${costoItem.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Total */}
        {items.length > 0 && (
          <div style={estilos.totalContenedor}>
            <span style={estilos.totalLabel}>Costo Total Estimado:</span>
            <span style={estilos.totalValor}>
              ${costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const estilos = {
  contenedor: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
  },
  encabezado: {
    marginBottom: '20px',
  },
  tituloFila: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    margin: 0,
    color: 'var(--text, #2C1810)',
  },
  subtitulo: {
    fontSize: '16px',
    color: 'var(--text-light, #8B7355)',
    margin: '4px 0 0 40px',
  },
  botones: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  botonGenerar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 700,
    background: 'var(--primary, #1B7A5A)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  botonImprimir: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 700,
    background: 'var(--card, #FEFCF9)',
    color: 'var(--text, #2C1810)',
    border: '2px solid var(--border, #F0E6D8)',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  agregarContenedor: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '16px',
    background: 'var(--bg-warm, #FEF7ED)',
    borderRadius: '14px',
    border: '1px solid var(--border, #F0E6D8)',
  },
  inputAgregar: {
    flex: 1,
    minWidth: '180px',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid var(--border, #F0E6D8)',
    borderRadius: '10px',
    outline: 'none',
    background: 'var(--card, #FEFCF9)',
    color: 'var(--text, #2C1810)',
  },
  cantidadControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  botonCantidad: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: '2px solid var(--border, #F0E6D8)',
    borderRadius: '8px',
    background: 'var(--card, #FEFCF9)',
    cursor: 'pointer',
    color: 'var(--text, #2C1810)',
  },
  cantidadTexto: {
    fontSize: '18px',
    fontWeight: 700,
    minWidth: '30px',
    textAlign: 'center',
  },
  botonAgregar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 700,
    background: '#1B7A5A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  sinDatos: {
    textAlign: 'center',
    color: 'var(--text-placeholder, #B8A089)',
    fontSize: '16px',
    padding: '40px 20px',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemFila: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid var(--border, #F0E6D8)',
    transition: 'all 0.2s',
  },
  checkbox: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  printCheckbox: {
    width: '24px',
    flexShrink: 0,
    fontFamily: 'monospace',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemNombre: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text, #2C1810)',
  },
  badgeManual: {
    display: 'inline-block',
    marginLeft: '8px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(224,122,58,0.15)',
    color: '#C96A2E',
    borderRadius: '6px',
    verticalAlign: 'middle',
  },
  itemStock: {
    display: 'block',
    fontSize: '13px',
    color: 'var(--text-placeholder, #B8A089)',
    marginTop: '2px',
  },
  cantidadControlItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  botonCantidadPeq: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid var(--border, #F0E6D8)',
    borderRadius: '8px',
    background: 'var(--card, #FEFCF9)',
    cursor: 'pointer',
    color: 'var(--text, #2C1810)',
  },
  cantidadItem: {
    fontSize: '16px',
    fontWeight: 700,
    minWidth: '28px',
    textAlign: 'center',
  },
  itemCosto: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text, #2C1810)',
    flexShrink: 0,
    minWidth: '70px',
    textAlign: 'right',
  },
  totalContenedor: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    padding: '20px 24px',
    background: 'rgba(27,122,90,0.08)',
    borderRadius: '14px',
    border: '2px solid rgba(27,122,90,0.2)',
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    color: 'var(--text, #2C1810)',
  },
  totalValor: {
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    color: 'var(--primary, #1B7A5A)',
  },
};
