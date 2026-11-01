import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiDollarSign, FiPlus, FiX, FiPhone, FiMapPin, FiCheck } from 'react-icons/fi';
import {
  getClientes,
  crearCliente,
  actualizarCliente,
  getSaldoCliente,
  getFiadosPendientes,
  getFiadosPorCliente,
  registrarPago,
} from '../services/api';

// Responsive styles
if (typeof document !== 'undefined' && !document.getElementById('fiados-responsive')) {
  const s = document.createElement('style');
  s.id = 'fiados-responsive';
  s.textContent = `
    @media (max-width: 600px) {
      .fiados-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

export default function Fiados() {
  const [vista, setVista] = useState('pendientes'); // 'pendientes' | 'clientes'
  const [busqueda, setBusqueda] = useState('');

  // Pendientes state
  const [pendientes, setPendientes] = useState([]);
  const [expandido, setExpandido] = useState(null); // clienteId expanded

  // Clientes state
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fiadosCliente, setFiadosCliente] = useState([]);

  // Modals
  const [modalCliente, setModalCliente] = useState(false);
  const [modalPago, setModalPago] = useState(null); // fiado object or null
  const [montoPago, setMontoPago] = useState('');
  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '', direccion: '' });
  const [cargando, setCargando] = useState(false);

  // Load pendientes
  const cargarPendientes = useCallback(async () => {
    try {
      const data = await getFiadosPendientes();
      // Group by client
      const agrupado = {};
      data.forEach((f) => {
        const cId = f.cliente?.id || f.clienteId;
        if (!agrupado[cId]) {
          agrupado[cId] = {
            cliente: f.cliente || { id: cId, nombre: 'Cliente #' + cId },
            fiados: [],
            total: 0,
          };
        }
        agrupado[cId].fiados.push(f);
        agrupado[cId].total += (f.monto - (f.montoPagado || 0));
      });
      setPendientes(Object.values(agrupado));
    } catch {
      toast.error('Error al cargar fiados pendientes');
    }
  }, []);

  const cargarClientes = useCallback(async () => {
    try {
      const data = await getClientes();
      // Fetch saldo for each
      const conSaldo = await Promise.all(
        data.map(async (c) => {
          try {
            const saldo = await getSaldoCliente(c.id);
            return { ...c, saldoPendiente: saldo?.saldoPendiente ?? saldo ?? 0 };
          } catch {
            return { ...c, saldoPendiente: 0 };
          }
        })
      );
      setClientes(conSaldo);
    } catch {
      toast.error('Error al cargar clientes');
    }
  }, []);

  useEffect(() => {
    if (vista === 'pendientes') cargarPendientes();
    else cargarClientes();
  }, [vista, cargarPendientes, cargarClientes]);

  const verFiadosCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    try {
      const data = await getFiadosPorCliente(cliente.id);
      setFiadosCliente(data);
    } catch {
      toast.error('Error al cargar fiados del cliente');
    }
  };

  // Payment
  const abrirPago = (fiado) => {
    setModalPago(fiado);
    setMontoPago('');
  };

  const hacerPago = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoPago);
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }
    setCargando(true);
    try {
      await registrarPago(modalPago.id, monto);
      toast.success('Pago registrado correctamente');
      setModalPago(null);
      setMontoPago('');
      // Refresh
      if (vista === 'pendientes') {
        cargarPendientes();
      } else if (clienteSeleccionado) {
        verFiadosCliente(clienteSeleccionado);
        cargarClientes();
      }
    } catch {
      toast.error('Error al registrar el pago');
    } finally {
      setCargando(false);
    }
  };

  // Add client
  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!formCliente.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setCargando(true);
    try {
      await crearCliente(formCliente);
      toast.success('Cliente creado');
      setModalCliente(false);
      setFormCliente({ nombre: '', telefono: '', direccion: '' });
      cargarClientes();
    } catch {
      toast.error('Error al crear cliente');
    } finally {
      setCargando(false);
    }
  };

  // Filtering
  const pendientesFiltrados = pendientes.filter((g) =>
    g.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <h1 style={styles.titulo}>Fiados (Creditos)</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={vista === 'pendientes' ? styles.tabActivo : styles.tabBtn}
          onClick={() => { setVista('pendientes'); setClienteSeleccionado(null); }}
        >
          <FiDollarSign size={18} /> Pendientes
        </button>
        <button
          style={vista === 'clientes' ? styles.tabActivo : styles.tabBtn}
          onClick={() => { setVista('clientes'); setClienteSeleccionado(null); }}
        >
          <FiUser size={18} /> Todos los Clientes
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchBox}>
        <FiUser size={18} style={{ color: 'var(--text-light)' }} />
        <input
          type="text"
          placeholder="Buscar cliente..."
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

      {/* ===== PENDIENTES VIEW ===== */}
      {vista === 'pendientes' && (
        <div>
          {pendientesFiltrados.length === 0 ? (
            <div style={styles.vacio}>
              <FiCheck size={40} color="var(--success)" />
              <p style={{ color: 'var(--text-light)', fontSize: '18px', margin: 0 }}>
                No hay fiados pendientes
              </p>
            </div>
          ) : (
            pendientesFiltrados.map((grupo) => (
              <div key={grupo.cliente.id} style={styles.clienteCard}>
                <div
                  style={styles.clienteHeader}
                  onClick={() => setExpandido(
                    expandido === grupo.cliente.id ? null : grupo.cliente.id
                  )}
                >
                  <div style={styles.clienteInfo}>
                    <div style={styles.avatar}>
                      <FiUser size={24} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '18px', color: 'var(--text)' }}>
                        {grupo.cliente.nombre}
                      </strong>
                      {grupo.cliente.telefono && (
                        <div style={{ color: 'var(--text-light)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiPhone size={12} /> {grupo.cliente.telefono}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={styles.totalDeuda}>
                    <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>Debe:</span>
                    <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--danger)' }}>
                      ${grupo.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Expanded fiados */}
                {expandido === grupo.cliente.id && (
                  <div style={styles.fiadosList}>
                    {grupo.fiados.map((f) => {
                      const restante = f.monto - (f.montoPagado || 0);
                      return (
                        <div key={f.id} style={styles.fiadoItem}>
                          <div style={styles.fiadoInfo}>
                            <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                              {formatDate(f.fecha)}
                            </span>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              <span>Total: <strong>${f.monto.toFixed(2)}</strong></span>
                              <span>Pagado: <strong style={{ color: 'var(--success)' }}>${(f.montoPagado || 0).toFixed(2)}</strong></span>
                              <span>Resta: <strong style={{ color: 'var(--danger)' }}>${restante.toFixed(2)}</strong></span>
                            </div>
                          </div>
                          {restante > 0 && (
                            <button style={styles.btnPago} onClick={() => abrirPago(f)}>
                              <FiDollarSign size={16} /> Registrar Pago
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== CLIENTES VIEW ===== */}
      {vista === 'clientes' && !clienteSeleccionado && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <button style={styles.btnPrimary} onClick={() => setModalCliente(true)}>
              <FiPlus size={20} /> Agregar Cliente
            </button>
          </div>

          {clientesFiltrados.length === 0 ? (
            <div style={styles.vacio}>
              <FiUser size={40} color="var(--text-light)" />
              <p style={{ color: 'var(--text-light)', fontSize: '18px', margin: 0 }}>
                No se encontraron clientes
              </p>
            </div>
          ) : (
            <div className="fiados-grid" style={styles.clientesGrid}>
              {clientesFiltrados.map((c) => (
                <div
                  key={c.id}
                  style={styles.clienteCardSmall}
                  onClick={() => verFiadosCliente(c)}
                >
                  <div style={styles.clienteInfo}>
                    <div style={styles.avatar}>
                      <FiUser size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '16px', color: 'var(--text)' }}>{c.nombre}</strong>
                      {c.telefono && (
                        <div style={{ color: 'var(--text-light)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiPhone size={12} /> {c.telefono}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Pendiente</span>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: (typeof c.saldoPendiente === 'number' ? c.saldoPendiente : 0) > 0
                        ? 'var(--danger)' : 'var(--success)',
                    }}>
                      ${(typeof c.saldoPendiente === 'number' ? c.saldoPendiente : 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== CLIENT DETAIL VIEW ===== */}
      {vista === 'clientes' && clienteSeleccionado && (
        <div>
          <button
            style={styles.btnBack}
            onClick={() => { setClienteSeleccionado(null); setFiadosCliente([]); }}
          >
            ← Volver a Clientes
          </button>
          <div style={styles.clienteDetail}>
            <div style={styles.avatar}><FiUser size={28} /></div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text)' }}>{clienteSeleccionado.nombre}</h2>
              {clienteSeleccionado.telefono && (
                <p style={{ margin: '4px 0', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiPhone size={14} /> {clienteSeleccionado.telefono}
                </p>
              )}
              {clienteSeleccionado.direccion && (
                <p style={{ margin: '4px 0', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiMapPin size={14} /> {clienteSeleccionado.direccion}
                </p>
              )}
            </div>
          </div>

          <h3 style={{ color: 'var(--text)', margin: '20px 0 12px' }}>Fiados</h3>
          {fiadosCliente.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>
              Este cliente no tiene fiados
            </p>
          ) : (
            fiadosCliente.map((f) => {
              const restante = f.monto - (f.montoPagado || 0);
              return (
                <div key={f.id} style={styles.fiadoItem}>
                  <div style={styles.fiadoInfo}>
                    <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                      {formatDate(f.fecha)}
                    </span>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text)' }}>Total: <strong>${f.monto.toFixed(2)}</strong></span>
                      <span style={{ color: 'var(--text)' }}>Pagado: <strong style={{ color: 'var(--success)' }}>${(f.montoPagado || 0).toFixed(2)}</strong></span>
                      <span style={{ color: 'var(--text)' }}>Resta: <strong style={{ color: 'var(--danger)' }}>${restante.toFixed(2)}</strong></span>
                    </div>
                  </div>
                  {restante > 0 && (
                    <button style={styles.btnPago} onClick={() => abrirPago(f)}>
                      <FiDollarSign size={16} /> Registrar Pago
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {modalPago && (
        <div style={styles.overlay} onClick={() => setModalPago(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text)' }}>Registrar Pago</h2>
              <button style={styles.closeBtn} onClick={() => setModalPago(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div style={styles.pagoDetalle}>
              <div style={styles.pagoRow}>
                <span style={{ color: 'var(--text-light)' }}>Monto del fiado:</span>
                <strong style={{ color: 'var(--text)' }}>${modalPago.monto.toFixed(2)}</strong>
              </div>
              <div style={styles.pagoRow}>
                <span style={{ color: 'var(--text-light)' }}>Ya pagado:</span>
                <strong style={{ color: 'var(--success)' }}>${(modalPago.montoPagado || 0).toFixed(2)}</strong>
              </div>
              <div style={{ ...styles.pagoRow, borderTop: '2px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Restante:</span>
                <strong style={{ color: 'var(--danger)', fontSize: '22px' }}>
                  ${(modalPago.monto - (modalPago.montoPagado || 0)).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={hacerPago} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Monto del pago</label>
                <input
                  style={styles.input}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={modalPago.monto - (modalPago.montoPagado || 0)}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="$0.00"
                  autoFocus
                />
              </div>
              <button
                type="button"
                style={styles.btnPagarTodo}
                onClick={() => setMontoPago(
                  (modalPago.monto - (modalPago.montoPagado || 0)).toFixed(2)
                )}
              >
                <FiCheck size={18} /> Pagar Todo
              </button>
              <button type="submit" style={styles.btnPrimary} disabled={cargando}>
                {cargando ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD CLIENT MODAL ===== */}
      {modalCliente && (
        <div style={styles.overlay} onClick={() => setModalCliente(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text)' }}>Agregar Cliente</h2>
              <button style={styles.closeBtn} onClick={() => setModalCliente(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={guardarCliente} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FiUser size={14} style={{ marginRight: '6px' }} /> Nombre *
                </label>
                <input
                  style={styles.input}
                  value={formCliente.nombre}
                  onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FiPhone size={14} style={{ marginRight: '6px' }} /> Telefono
                </label>
                <input
                  style={styles.input}
                  value={formCliente.telefono}
                  onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                  placeholder="Ej: 555-123-4567"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FiMapPin size={14} style={{ marginRight: '6px' }} /> Direccion
                </label>
                <input
                  style={styles.input}
                  value={formCliente.direccion}
                  onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })}
                  placeholder="Direccion opcional"
                />
              </div>
              <button type="submit" style={styles.btnPrimary} disabled={cargando}>
                {cargando ? 'Guardando...' : 'Guardar Cliente'}
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
    maxWidth: '900px',
    margin: '0 auto',
  },
  titulo: {
    margin: '0 0 20px',
    fontSize: '28px',
    fontFamily: "'Nunito', sans-serif",
    color: 'var(--text)',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--card)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontWeight: 500,
    flex: 1,
    justifyContent: 'center',
  },
  tabActivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    border: 'none',
    borderRadius: 'var(--radius)',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    flex: 1,
    justifyContent: 'center',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--card)',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    marginBottom: '20px',
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
  vacio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
  },
  // Client card (pendientes)
  clienteCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  clienteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    gap: '12px',
    flexWrap: 'wrap',
  },
  clienteInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#FEF7ED',
    border: '2px solid #F0E6D8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1B7A5A',
    fontWeight: 700,
    flexShrink: 0,
  },
  totalDeuda: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  fiadosList: {
    borderTop: '1px solid var(--border)',
    padding: '8px 16px 16px',
  },
  fiadoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'var(--bg)',
    borderRadius: 'var(--radius)',
    marginTop: '8px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  fiadoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    color: 'var(--text)',
  },
  btnPago: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--radius)',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // Clientes view
  clientesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  clienteCardSmall: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  btnBack: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '12px',
    fontWeight: 500,
  },
  clienteDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  },
  // Modals
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
    maxWidth: '450px',
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
  pagoDetalle: {
    background: 'var(--bg)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    marginBottom: '20px',
  },
  pagoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    color: 'var(--text)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    display: 'flex',
    alignItems: 'center',
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
  btnPagarTodo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '15px',
    fontWeight: 600,
    border: '2px solid var(--success)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--success)',
    cursor: 'pointer',
    width: '100%',
  },
};
