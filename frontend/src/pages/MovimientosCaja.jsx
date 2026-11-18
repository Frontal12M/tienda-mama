import { useState, useEffect } from 'react';
import { FiPlus, FiArrowUpCircle, FiArrowDownCircle, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getResumenCaja, crearMovimientoCaja } from '../services/api';

function hoyStr() {
  return new Date().toISOString().split('T')[0];
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function MovimientosCaja() {
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'ENTRADA', monto: '', concepto: '' });
  const [submitting, setSubmitting] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const hoy = hoyStr();
      const data = await getResumenCaja(hoy, hoy);
      setResumen(data);
      setMovimientos(data.movimientos || []);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.monto || parseFloat(form.monto) <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }
    if (!form.concepto.trim()) {
      toast.error('Ingresa un concepto');
      return;
    }
    try {
      setSubmitting(true);
      await crearMovimientoCaja({
        tipo: form.tipo,
        monto: parseFloat(form.monto),
        concepto: form.concepto.trim(),
      });
      toast.success(form.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada');
      setForm({ tipo: 'ENTRADA', monto: '', concepto: '' });
      setShowModal(false);
      cargar();
    } catch (err) {
      toast.error('Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  }

  const conceptosSugeridos = form.tipo === 'ENTRADA'
    ? ['Fondo inicial', 'Pago de deuda', 'Deposito', 'Otro ingreso']
    : ['Compra de mercancia', 'Pago de luz', 'Pago de agua', 'Pago de renta', 'Retiro personal', 'Comida', 'Gastos varios'];

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>Movimientos de Caja</h1>
        <button style={S.addBtn} onClick={() => setShowModal(true)}>
          <FiPlus size={20} /> Registrar Movimiento
        </button>
      </div>

      {/* Summary Cards */}
      <div style={S.cards}>
        <div style={{ ...S.card, borderLeft: '4px solid #1B7A5A' }}>
          <div style={S.cardIcon}><FiArrowUpCircle size={28} color="#1B7A5A" /></div>
          <div>
            <div style={S.cardLabel}>Entradas</div>
            <div style={{ ...S.cardValue, color: '#1B7A5A' }}>
              {cargando ? '...' : formatMoney(resumen?.totalEntradas)}
            </div>
          </div>
        </div>
        <div style={{ ...S.card, borderLeft: '4px solid #E07A3A' }}>
          <div style={S.cardIcon}><FiArrowDownCircle size={28} color="#E07A3A" /></div>
          <div>
            <div style={S.cardLabel}>Salidas</div>
            <div style={{ ...S.cardValue, color: '#E07A3A' }}>
              {cargando ? '...' : formatMoney(resumen?.totalSalidas)}
            </div>
          </div>
        </div>
        <div style={{ ...S.card, borderLeft: '4px solid #2C1810' }}>
          <div style={S.cardIcon}><FiDollarSign size={28} color="#2C1810" /></div>
          <div>
            <div style={S.cardLabel}>Balance</div>
            <div style={{ ...S.cardValue, color: '#2C1810' }}>
              {cargando ? '...' : formatMoney(resumen?.balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Movements List */}
      <div style={S.listSection}>
        <h2 style={S.subtitle}>Movimientos de Hoy</h2>
        {cargando ? (
          <p style={S.empty}>Cargando...</p>
        ) : movimientos.length === 0 ? (
          <div style={S.emptyBox}>
            <FiDollarSign size={40} color="#ccc" />
            <p style={S.empty}>No hay movimientos hoy</p>
            <p style={{ color: '#999', fontSize: 14 }}>Registra entradas y salidas de tu caja</p>
          </div>
        ) : (
          <div style={S.list}>
            {movimientos.map((m, i) => (
              <div key={m.id || i} style={S.row}>
                <div style={S.rowLeft}>
                  {m.tipo === 'ENTRADA' ? (
                    <FiArrowUpCircle size={24} color="#1B7A5A" />
                  ) : (
                    <FiArrowDownCircle size={24} color="#E07A3A" />
                  )}
                  <div>
                    <div style={S.rowConcepto}>{m.concepto}</div>
                    <div style={S.rowHora}>
                      {new Date(m.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div style={{
                  ...S.rowMonto,
                  color: m.tipo === 'ENTRADA' ? '#1B7A5A' : '#E07A3A',
                }}>
                  {m.tipo === 'ENTRADA' ? '+' : '-'}{formatMoney(m.monto)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={S.modalTitle}>Registrar Movimiento</h2>

            <form onSubmit={handleSubmit}>
              {/* Tipo Toggle */}
              <div style={S.tipoToggle}>
                <button
                  type="button"
                  style={{
                    ...S.tipoBtn,
                    ...(form.tipo === 'ENTRADA' ? S.tipoBtnActiveEntrada : {}),
                  }}
                  onClick={() => setForm({ ...form, tipo: 'ENTRADA' })}
                >
                  <FiArrowUpCircle size={20} /> Entrada
                </button>
                <button
                  type="button"
                  style={{
                    ...S.tipoBtn,
                    ...(form.tipo === 'SALIDA' ? S.tipoBtnActiveSalida : {}),
                  }}
                  onClick={() => setForm({ ...form, tipo: 'SALIDA' })}
                >
                  <FiArrowDownCircle size={20} /> Salida
                </button>
              </div>

              {/* Monto */}
              <label style={S.label}>Monto</label>
              <div style={S.montoInput}>
                <span style={S.montoPrefix}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  style={S.input}
                  autoFocus
                />
              </div>

              {/* Concepto */}
              <label style={S.label}>Concepto</label>
              <input
                type="text"
                placeholder="Ej: Compra de mercancia"
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                style={{ ...S.input, paddingLeft: 12 }}
              />

              {/* Quick concept buttons */}
              <div style={S.chips}>
                {conceptosSugeridos.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{
                      ...S.chip,
                      ...(form.concepto === c ? S.chipActive : {}),
                    }}
                    onClick={() => setForm({ ...form, concepto: c })}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Buttons */}
              <div style={S.modalActions}>
                <button type="button" style={S.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    ...S.submitBtn,
                    backgroundColor: form.tipo === 'ENTRADA' ? '#1B7A5A' : '#E07A3A',
                    opacity: submitting ? 0.6 : 1,
                  }}
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : `Registrar ${form.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  container: {
    padding: '24px 32px',
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#2C1810',
    margin: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    backgroundColor: '#1B7A5A',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 24px',
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(44,24,16,0.06)',
  },
  cardIcon: {
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: 600,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 800,
  },
  listSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(44,24,16,0.06)',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2C1810',
    marginTop: 0,
    marginBottom: 16,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: 12,
    backgroundColor: '#faf8f5',
    border: '1px solid #f0ebe4',
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  rowConcepto: {
    fontSize: 15,
    fontWeight: 600,
    color: '#2C1810',
  },
  rowHora: {
    fontSize: 12,
    color: '#999',
  },
  rowMonto: {
    fontSize: 18,
    fontWeight: 800,
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px 0',
  },
  empty: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
  },

  // Modal
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#2C1810',
    marginTop: 0,
    marginBottom: 20,
  },
  tipoToggle: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  tipoBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: 12,
    backgroundColor: 'white',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.15s',
  },
  tipoBtnActiveEntrada: {
    borderColor: '#1B7A5A',
    backgroundColor: '#e8f5e9',
    color: '#1B7A5A',
  },
  tipoBtnActiveSalida: {
    borderColor: '#E07A3A',
    backgroundColor: '#fff3e0',
    color: '#E07A3A',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  montoInput: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  montoPrefix: {
    fontSize: 24,
    fontWeight: 800,
    color: '#2C1810',
    marginRight: 8,
  },
  input: {
    width: '100%',
    padding: '14px 12px',
    fontSize: 18,
    fontWeight: 600,
    border: '2px solid #e0e0e0',
    borderRadius: 12,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    padding: '8px 14px',
    borderRadius: 20,
    border: '1px solid #e0e0e0',
    backgroundColor: '#faf8f5',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.15s',
  },
  chipActive: {
    borderColor: '#1B7A5A',
    backgroundColor: '#e8f5e9',
    color: '#1B7A5A',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: 12,
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#666',
  },
  submitBtn: {
    flex: 2,
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    color: 'white',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
