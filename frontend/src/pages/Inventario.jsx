import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiSearch, FiX } from 'react-icons/fi';
import {
  getProductos,
  getProductosBajoStock,
  getCategorias,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  eliminarProducto,
} from '../services/api';

const emptyForm = {
  nombre: '',
  codigoBarras: '',
  descripcion: '',
  categoriaId: '',
  precioCompra: '',
  precioVenta: '',
  stock: '',
  stockMinimo: '',
};

// Inject responsive styles
if (typeof document !== 'undefined' && !document.getElementById('inv-responsive')) {
  const s = document.createElement('style');
  s.id = 'inv-responsive';
  s.textContent = `
    .inv-table-wrap { display: block; }
    .inv-cards { display: none; }
    @media (max-width: 768px) {
      .inv-table-wrap { display: none !important; }
      .inv-cards { display: block !important; }
      .inv-form-row { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [cargando, setCargando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([
        filtro === 'bajo' ? getProductosBajoStock() : getProductos(),
        getCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch {
      toast.error('Error al cargar los datos');
    }
  }, [filtro]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const productosFiltrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirAgregar = () => {
    setEditandoId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const abrirEditar = (prod) => {
    setEditandoId(prod.id);
    setForm({
      nombre: prod.nombre || '',
      codigoBarras: prod.codigoBarras || '',
      descripcion: prod.descripcion || '',
      categoriaId: prod.categoria?.id || prod.categoriaId || '',
      precioCompra: prod.precioCompra ?? '',
      precioVenta: prod.precioVenta ?? '',
      stock: prod.stock ?? '',
      stockMinimo: prod.stockMinimo ?? '',
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditandoId(null);
    setForm(emptyForm);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precioVenta) {
      toast.error('Nombre y Precio Venta son obligatorios');
      return;
    }
    setCargando(true);
    try {
      const payload = {
        ...form,
        precioCompra: parseFloat(form.precioCompra) || 0,
        precioVenta: parseFloat(form.precioVenta) || 0,
        stock: parseInt(form.stock, 10) || 0,
        stockMinimo: parseInt(form.stockMinimo, 10) || 0,
        categoriaId: form.categoriaId ? parseInt(form.categoriaId, 10) : null,
      };
      if (editandoId) {
        await actualizarProducto(editandoId, payload);
        toast.success('Producto actualizado');
      } else {
        await crearProducto(payload);
        toast.success('Producto creado');
      }
      cerrarModal();
      cargarDatos();
    } catch {
      toast.error('Error al guardar el producto');
    } finally {
      setCargando(false);
    }
  };

  const cambiarStock = async (id, delta) => {
    try {
      await actualizarStock(id, delta);
      toast.success(delta > 0 ? 'Stock aumentado' : 'Stock reducido');
      cargarDatos();
    } catch {
      toast.error('Error al actualizar stock');
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      await eliminarProducto(id);
      toast.success('Producto eliminado');
      cargarDatos();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const stockColor = (prod) => {
    if (prod.stock <= prod.stockMinimo) return 'var(--danger)';
    if (prod.stock <= prod.stockMinimo * 1.5) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.titulo}>Inventario</h1>
        <button style={styles.btnPrimary} onClick={abrirAgregar}>
          <FiPlus size={20} /> Agregar Producto
        </button>
      </div>

      {/* Search and filters */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <FiSearch size={18} style={{ color: 'var(--text-light)' }} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
          {busqueda && (
            <button style={styles.clearBtn} onClick={() => setBusqueda('')}>
              <FiX size={16} />
            </button>
          )}
        </div>
        <div style={styles.filtros}>
          <button
            style={filtro === 'todos' ? styles.filtroActivo : styles.filtroBtn}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
          <button
            style={filtro === 'bajo'
              ? { ...styles.filtroActivo, background: 'var(--danger)' }
              : styles.filtroBtn}
            onClick={() => setFiltro('bajo')}
          >
            <FiAlertTriangle size={16} /> Bajo Stock
          </button>
        </div>
      </div>

      {/* Empty state */}
      {productosFiltrados.length === 0 ? (
        <div style={styles.vacio}>
          <FiAlertTriangle size={40} color="var(--text-light)" />
          <p style={{ color: 'var(--text-light)', fontSize: '18px', margin: 0 }}>
            No se encontraron productos
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="inv-table-wrap" style={styles.tablaWrapper}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Codigo</th>
                  <th style={styles.th}>Categoria</th>
                  <th style={styles.th}>P. Compra</th>
                  <th style={styles.th}>P. Venta</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Stock Min.</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}><strong>{p.nombre}</strong></td>
                    <td style={styles.td}>{p.codigoBarras || '—'}</td>
                    <td style={styles.td}>{p.categoria?.nombre || '—'}</td>
                    <td style={styles.td}>${(p.precioCompra ?? 0).toFixed(2)}</td>
                    <td style={styles.td}>${(p.precioVenta ?? 0).toFixed(2)}</td>
                    <td style={{
                      ...styles.td,
                      color: stockColor(p),
                      fontWeight: 'bold',
                      fontSize: '18px',
                    }}>
                      {p.stock}
                    </td>
                    <td style={styles.td}>{p.stockMinimo}</td>
                    <td style={styles.td}>
                      {p.stock <= p.stockMinimo ? (
                        <span style={styles.badgeDanger}>
                          <FiAlertTriangle size={14} /> Bajo
                        </span>
                      ) : (
                        <span style={styles.badgeSuccess}>OK</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.acciones}>
                        <button style={styles.btnStock} onClick={() => cambiarStock(p.id, -1)} title="Quitar 1">
                          −
                        </button>
                        <button
                          style={{ ...styles.btnStock, background: 'var(--success)', color: '#fff' }}
                          onClick={() => cambiarStock(p.id, 1)}
                          title="Agregar 1"
                        >
                          +
                        </button>
                        <button style={styles.btnEdit} onClick={() => abrirEditar(p)} title="Editar">
                          <FiEdit2 size={16} />
                        </button>
                        <button style={styles.btnDelete} onClick={() => borrar(p.id)} title="Eliminar">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="inv-cards">
            {productosFiltrados.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>{p.nombre}</strong>
                    <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                      {p.categoria?.nombre || 'Sin categoria'}
                      {p.codigoBarras ? ` • ${p.codigoBarras}` : ''}
                    </div>
                  </div>
                  {p.stock <= p.stockMinimo && (
                    <span style={styles.badgeDanger}>
                      <FiAlertTriangle size={14} /> Bajo
                    </span>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardStat}>
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Compra</span>
                    <span>${(p.precioCompra ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={styles.cardStat}>
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Venta</span>
                    <span style={{ fontWeight: 'bold' }}>${(p.precioVenta ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={styles.cardStat}>
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Stock</span>
                    <span style={{ fontWeight: 'bold', fontSize: '20px', color: stockColor(p) }}>
                      {p.stock}
                    </span>
                  </div>
                  <div style={styles.cardStat}>
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>Min.</span>
                    <span>{p.stockMinimo}</span>
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.btnStock} onClick={() => cambiarStock(p.id, -1)}>
                    − Quitar
                  </button>
                  <button
                    style={{ ...styles.btnStock, background: 'var(--success)', color: '#fff' }}
                    onClick={() => cambiarStock(p.id, 1)}
                  >
                    + Agregar
                  </button>
                  <button style={styles.btnEdit} onClick={() => abrirEditar(p)}>
                    <FiEdit2 size={16} /> Editar
                  </button>
                  <button style={styles.btnDelete} onClick={() => borrar(p.id)}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={cerrarModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text)', fontFamily: "'Nunito', sans-serif" }}>
                {editandoId ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              <button style={styles.closeBtn} onClick={cerrarModal}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={guardar} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre *</label>
                <input
                  style={styles.input}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Coca Cola 600ml"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Codigo de Barras</label>
                <input
                  style={styles.input}
                  value={form.codigoBarras}
                  onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                  placeholder="Escanear o escribir codigo"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Descripcion</label>
                <input
                  style={styles.input}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripcion opcional"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Categoria</label>
                <select
                  style={styles.input}
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                >
                  <option value="">— Sin categoria —</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="inv-form-row" style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Precio Compra</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precioCompra}
                    onChange={(e) => setForm({ ...form, precioCompra: e.target.value })}
                    placeholder="$0.00"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Precio Venta *</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precioVenta}
                    onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                    placeholder="$0.00"
                  />
                </div>
              </div>
              <div className="inv-form-row" style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock Actual</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock Minimo</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
              <button type="submit" style={styles.btnPrimary} disabled={cargando}>
                {cargando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
  },
  titulo: {
    margin: 0,
    fontSize: '28px',
    color: 'var(--text)',
    fontFamily: "'Nunito', sans-serif",
  },
  toolbar: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--card)',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    flex: '1 1 250px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '16px',
    color: 'var(--text)',
    flex: 1,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-light)',
    padding: '4px',
    display: 'flex',
  },
  filtros: {
    display: 'flex',
    gap: '8px',
  },
  filtroBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    fontSize: '15px',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--card)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontWeight: 500,
  },
  filtroActivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    fontSize: '15px',
    border: 'none',
    borderRadius: 'var(--radius)',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  tablaWrapper: {
    overflowX: 'auto',
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '15px',
  },
  th: {
    padding: '14px 12px',
    textAlign: 'left',
    borderBottom: '2px solid var(--border)',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '12px',
    verticalAlign: 'middle',
    color: 'var(--text)',
  },
  acciones: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  btnStock: {
    padding: '8px 14px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--card)',
    color: 'var(--text)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  btnEdit: {
    padding: '8px 12px',
    border: '2px solid var(--primary)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
  },
  btnDelete: {
    padding: '8px 12px',
    border: '2px solid var(--danger)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--danger)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
  },
  badgeDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'var(--danger)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  },
  badgeSuccess: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'var(--success)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    marginBottom: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  cardBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '8px',
    marginBottom: '12px',
  },
  cardStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '14px',
    color: 'var(--text)',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  vacio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-light)',
    padding: '4px',
    display: 'flex',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--radius)',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    width: '100%',
  },
};
