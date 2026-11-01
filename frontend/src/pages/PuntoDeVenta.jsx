import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiUser, FiClock, FiPrinter, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  buscarProductos,
  getProductoPorCodigo,
  registrarVenta,
  buscarClientes,
} from '../services/api';

/* ─────────────── helpers ─────────────── */

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

/* ─────────────── styles ─────────────── */

const S = {
  page: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    background: 'var(--bg)',
  },

  /* ---------- LEFT PANEL ---------- */
  left: {
    width: '60%',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 16px 16px 16px',
    overflow: 'hidden',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 14,
    flexShrink: 0,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-light)',
    fontSize: 22,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '16px 16px 16px 50px',
    fontSize: 20,
    fontFamily: 'inherit',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    background: 'var(--card)',
    color: 'var(--text)',
    transition: 'border-color .2s',
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    alignContent: 'start',
    paddingBottom: 8,
  },
  productCard: {
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    padding: 18,
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 100,
    transition: 'box-shadow .15s, transform .1s',
    border: '2px solid transparent',
  },
  productCardActive: {
    boxShadow: 'var(--shadow-md)',
    transform: 'scale(0.97)',
    borderColor: 'var(--primary)',
  },
  productName: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--success)',
  },
  productStock: {
    fontSize: 14,
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  emptySearch: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--text-light)',
    fontSize: 18,
  },

  /* ---------- RIGHT PANEL ---------- */
  right: {
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '2px solid var(--border)',
    background: 'var(--card)',
    overflow: 'hidden',
  },
  cartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 18px',
    borderBottom: '2px solid var(--border)',
    flexShrink: 0,
  },
  cartTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 22,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
  },
  cartBadge: {
    background: '#E07A3A',
    color: '#fff',
    borderRadius: 20,
    padding: '2px 12px',
    fontSize: 15,
    fontWeight: 700,
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 18px',
    gap: 10,
    borderBottom: '1px solid var(--border)',
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cartItemPrice: {
    fontSize: 13,
    color: 'var(--text-light)',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    flexShrink: 0,
  },
  qtyBtn: {
    width: 42,
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--border)',
    background: 'var(--bg)',
    borderRadius: 8,
    fontSize: 20,
    cursor: 'pointer',
    color: 'var(--text)',
    fontWeight: 700,
    transition: 'background .15s',
  },
  qtyValue: {
    width: 38,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 700,
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    minWidth: 70,
    textAlign: 'right',
    flexShrink: 0,
  },
  deleteBtn: {
    width: 42,
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'none',
    color: 'var(--danger)',
    fontSize: 20,
    cursor: 'pointer',
    borderRadius: 8,
    flexShrink: 0,
    transition: 'background .15s',
  },
  cartEmpty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-light)',
    gap: 10,
    padding: 30,
  },
  cartEmptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },

  /* ---------- CHECKOUT FOOTER ---------- */
  footer: {
    flexShrink: 0,
    borderTop: '2px solid var(--border)',
    padding: '16px 18px 20px',
    background: 'var(--card)',
    position: 'sticky',
    bottom: 0,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 800,
    color: 'var(--text)',
    fontFamily: "'Nunito', sans-serif",
  },
  paymentRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  payBtn: {
    flex: 1,
    padding: '14px 8px',
    border: '3px solid transparent',
    borderRadius: 'var(--radius)',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform .1s, opacity .15s',
    color: '#fff',
    minHeight: 50,
  },
  payBtnSelected: {
    transform: 'scale(0.95)',
    opacity: 1,
  },
  payBtnUnselected: {
    opacity: 0.45,
  },
  cobrarBtn: {
    width: '100%',
    padding: '18px',
    border: 'none',
    borderRadius: 'var(--radius)',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 22,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    transition: 'background .15s, transform .1s',
    minHeight: 60,
    letterSpacing: 0.5,
  },
  cobrarDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  /* ---------- MODAL ---------- */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    width: '90%',
    maxWidth: 440,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '2px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 20,
    fontWeight: 700,
  },
  modalSearch: {
    padding: '14px 24px',
    borderBottom: '1px solid var(--border)',
  },
  modalSearchInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 18,
    border: '2px solid var(--border)',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'inherit',
  },
  modalList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  clientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 24px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background .15s',
    fontSize: 18,
    fontWeight: 500,
  },
  clientIcon: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: 'var(--text-light)',
    flexShrink: 0,
  },
  modalClose: {
    padding: '10px 18px',
    border: 'none',
    background: 'var(--bg)',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

/* ─────────────── component ─────────────── */

export default function PuntoDeVenta() {
  // ----- search state -----
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  // barcode detection: track keystroke timing
  const keystrokeTimes = useRef([]);
  const barcodeBuffer = useRef('');

  // ----- cart state -----
  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState(null); // EFECTIVO | TARJETA | FIADO
  const [submitting, setSubmitting] = useState(false);

  // ----- fiado modal -----
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);

  // ----- success animation -----
  const [showSuccess, setShowSuccess] = useState(false);
  const [historial, setHistorial] = useState([]); // saved sales for ticket reprint
  const [showHistorial, setShowHistorial] = useState(false);
  const [cambio, setCambio] = useState(0);
  const [recibido, setRecibido] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  /* ── debounced product search ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        setResults([]);
        setSearching(false);
        return;
      }
      try {
        setSearching(true);
        const res = await buscarProductos(term);
        setResults(Array.isArray(res) ? res : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    [],
  );

  /* ── handle search input ── */
  function handleSearchChange(e) {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  }

  /* ── barcode detection via keyDown on the search input ── */
  function handleSearchKeyDown(e) {
    const now = Date.now();

    if (e.key === 'Enter') {
      e.preventDefault();
      const buf = barcodeBuffer.current;
      const times = keystrokeTimes.current;

      // Check if this looks like a barcode scan:
      // many numeric chars typed very fast (< 50ms between each)
      if (buf.length >= 4 && times.length >= 4) {
        let allFast = true;
        for (let i = 1; i < times.length; i++) {
          if (times[i] - times[i - 1] > 50) {
            allFast = false;
            break;
          }
        }
        if (allFast) {
          // It's a barcode scan -- look up by code
          handleBarcodeScan(buf);
          setQuery('');
          barcodeBuffer.current = '';
          keystrokeTimes.current = [];
          return;
        }
      }

      // Not a barcode -- if the query is all digits and long enough, treat as manual barcode entry
      if (/^\d+$/.test(query.trim()) && query.trim().length >= 4) {
        handleBarcodeScan(query.trim());
        setQuery('');
      }

      barcodeBuffer.current = '';
      keystrokeTimes.current = [];
      return;
    }

    // Track numeric keystrokes for barcode detection
    if (/^\d$/.test(e.key)) {
      barcodeBuffer.current += e.key;
      keystrokeTimes.current.push(now);
    } else if (e.key.length === 1) {
      // Non-numeric character resets barcode detection
      barcodeBuffer.current = '';
      keystrokeTimes.current = [];
    }
  }

  /* ── barcode lookup ── */
  async function handleBarcodeScan(code) {
    try {
      const res = await getProductoPorCodigo(code);
      const producto = res.data;
      if (producto && producto.id) {
        addToCart(producto);
        toast.success(`${producto.nombre} agregado`);
        setResults([]);
      } else {
        toast.error('Producto no encontrado');
      }
    } catch {
      toast.error('Producto no encontrado');
    }
  }


  /* ── Camera barcode scanner ── */
  async function startCameraScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      scannerStreamRef.current = stream;
      setShowScanner(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          startBarcodeDetection();
        }
      }, 300);
    } catch (err) {
      toast.error("No se pudo acceder a la camara");
      console.error(err);
    }
  }

  function startBarcodeDetection() {
    if (!("BarcodeDetector" in window)) {
      toast.error("Tu navegador no soporta escaneo de codigos. Usa Chrome.");
      stopCameraScanner();
      return;
    }
    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"] });
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          stopCameraScanner();
          handleBarcodeScan(code);
        }
      } catch { /* ignore detection errors */ }
    }, 250);
  }

  function stopCameraScanner() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach(t => t.stop());
      scannerStreamRef.current = null;
    }
    setShowScanner(false);
  }
  /* ── cart operations ── */
  function addToCart(producto) {
    const existing = cart.find((item) => item.producto.id === producto.id);
    if (existing) {
      if (existing.cantidad >= producto.stock) {
        toast.error(`Solo hay ${producto.stock} en stock de ${producto.nombre}`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      if (producto.stock <= 0) {
        toast.error(`${producto.nombre} sin stock`);
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          producto,
          cantidad: 1,
          precioUnitario: producto.precioVenta ?? producto.precio ?? 0,
        },
      ]);
    }
  }

  function updateQty(productoId, delta) {
    if (delta > 0) {
      const item = cart.find((i) => i.producto.id === productoId);
      if (item && item.cantidad >= item.producto.stock) {
        toast.error(`Solo hay ${item.producto.stock} en stock`);
        return;
      }
    }
    setCart((prev) =>
      prev
        .map((item) =>
          item.producto.id === productoId
            ? { ...item, cantidad: item.cantidad + delta }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  }

  function removeFromCart(productoId) {
    setCart((prev) => prev.filter((item) => item.producto.id !== productoId));
  }

  const total = cart.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnitario,
    0,
  );
  const itemCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  /* ── payment method ── */
  function handleMetodo(m) {
    if (m === 'FIADO') {
      setMetodo('FIADO');
      setShowClientModal(true);
      loadClients('');
    } else {
      setMetodo(m);
      setSelectedClient(null);
    }
  }

  /* ── client search for fiado ── */
  async function loadClients(search) {
    try {
      setLoadingClients(true);
      const res = await buscarClientes(search);
      setClients(Array.isArray(res.data) ? res.data : res.data?.content ?? []);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }

  function handleClientSearchChange(e) {
    const val = e.target.value;
    setClientSearch(val);
    loadClients(val);
  }

  function selectClient(client) {
    setSelectedClient(client);
    setShowClientModal(false);
    setClientSearch('');
    toast.success(`Cliente: ${client.nombre}`);
  }

  /* ── print ticket ── */
  function imprimirTicket(cartItems, totalVenta, metodoPago, cambioVenta) {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    let lineas = '';
    cartItems.forEach((item) => {
      const nombre = item.producto.nombre.length > 20
        ? item.producto.nombre.substring(0, 20) + '...'
        : item.producto.nombre;
      const sub = (item.cantidad * item.precioUnitario).toFixed(2);
      lineas += `<tr><td>${nombre}</td><td style="text-align:center">${item.cantidad}</td><td style="text-align:right">$${Number(item.precioUnitario).toFixed(2)}</td><td style="text-align:right">$${sub}</td></tr>`;
    });

    const metodoTexto = metodoPago === 'EFECTIVO' ? 'Efectivo' : metodoPago === 'TARJETA' ? 'Tarjeta' : 'Fiado';
    const cambioHTML = metodoPago === 'EFECTIVO' && cambioVenta !== null
      ? `<p style="margin:2px 0"><strong>Recibido:</strong> $${(totalVenta + cambioVenta).toFixed(2)}</p><p style="margin:2px 0"><strong>Cambio:</strong> $${cambioVenta.toFixed(2)}</p>`
      : '';

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket - Abarrotes Lirios</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 280px;
            margin: 20px auto;
            color: #000;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .header h2 { margin: 0; font-size: 16px; }
          .header p { margin: 2px 0; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th { border-bottom: 1px dashed #000; padding: 2px 0; font-size: 11px; text-align: left; }
          td { padding: 3px 0; font-size: 11px; }
          .total-section { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
          .total-line { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 4px 0; }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 11px; }
          .print-btn { display: block; margin: 20px auto; padding: 10px 30px; font-size: 16px; background: #1B7A5A; color: white; border: none; border-radius: 8px; cursor: pointer; }
          .print-btn:hover { background: #15634A; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>ABARROTES LIRIOS</h2>
          <p>${fecha} - ${hora}</p>
        </div>

        <table>
          <thead>
            <tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">P.U.</th><th style="text-align:right">Subt</th></tr>
          </thead>
          <tbody>
            ${lineas}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-line"><span>TOTAL:</span><span>$${totalVenta.toFixed(2)}</span></div>
          <p style="margin:2px 0"><strong>Pago:</strong> ${metodoTexto}</p>
          ${cambioHTML}
        </div>

        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>Vuelva pronto</p>
        </div>

        <button class="no-print print-btn" onclick="window.print()">🖨️ Imprimir Ticket</button>
      </body>
      </html>
    `;

    const ventanaTicket = window.open('', '_blank', 'width=350,height=600');
    if (!ventanaTicket) { console.warn('Popup bloqueado'); return; }
    ventanaTicket.document.write(ticketHTML);
    ventanaTicket.document.close();
    // Auto-print after a short delay for rendering
    setTimeout(() => {
      try { ventanaTicket.print(); } catch (e) { /* user can print manually */ }
    }, 400);
  }

  /* ── submit sale ── */
  async function handleCobrar() {
    if (cart.length === 0 || !metodo) return;
    if (metodo === 'FIADO' && !selectedClient) {
      toast.error('Selecciona un cliente para fiado');
      setShowClientModal(true);
      loadClients('');
      return;
    }

    const ventaData = {
      metodoPago: metodo,
      total,
      detalles: cart.map((item) => ({
        producto: { id: item.producto.id },
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario,
      })),
    };

    if (metodo === 'FIADO' && selectedClient) {
      ventaData.cliente = { id: selectedClient.id };
    }

    try {
      setSubmitting(true);
      await registrarVenta(ventaData);
      toast.success(`Venta registrada — ${formatMoney(total)}`, {
        duration: 3000,
        icon: '✅',
        style: { fontSize: 18, fontWeight: 600 },
      });

      // Save to local historial for ticket reprint
      const savedCart = [...cart];
      const savedTotal = total;
      const savedMetodo = metodo;
      const now = new Date();
      const ventaHistorial = {
        id: Date.now(),
        fecha: now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        items: savedCart,
        total: savedTotal,
        metodo: savedMetodo,
        cambio: metodo === 'EFECTIVO' && recibido && parseFloat(recibido) > total ? parseFloat(recibido) - total : null,
        recibido: metodo === 'EFECTIVO' && recibido ? parseFloat(recibido) : null,
      };
      setHistorial(prev => [ventaHistorial, ...prev].slice(0, 50)); // keep last 50

      // ticket is saved in historial - user can reprint from there

      // success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1200);

      // reset
      setCart([]);
      setMetodo(null);
      setRecibido('');
      setSelectedClient(null);
      setQuery('');
      setResults([]);
      setCambio(0);
      searchRef.current?.focus();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al registrar venta');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── safe ticket print (won't trigger error toast) ── */
  function safePrintTicket(cartItems, totalVenta, metodoPago, cambioVenta) {
    try {
      imprimirTicket(cartItems, totalVenta, metodoPago, cambioVenta);
    } catch (e) {
      console.warn('No se pudo abrir la ventana del ticket:', e);
      toast('Ticket no disponible — ¿bloqueador de popups?', { icon: '🖨️' });
    }
  }

  /* ── can checkout? ── */
  const canCheckout = cart.length > 0 && metodo && !submitting;

  /* ─────────────── render ─────────────── */
  return (
    <div style={S.page}>
      {/* ===== LEFT: Products ===== */}
      <div style={S.left}>
        {/* Search */}
        <div style={{ ...S.searchWrap, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={S.searchIcon} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar producto o escanear codigo..."
              style={S.searchInput}
              autoComplete="off"
            />
          </div>
          <button
            onClick={startCameraScanner}
            style={{
              width: 48, height: 48, borderRadius: 12,
              border: '2px solid var(--border, #F0E6D8)',
              background: 'var(--card, #FEFCF9)',
              color: '#1B7A5A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
            }}
            title="Escanear con camara"
          >
            <FiCamera size={22} />
          </button>
        </div>

        {/* Camera Scanner Overlay */}
        {showScanner && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              📷 Apunta al codigo de barras
            </p>
            <div style={{
              position: 'relative', width: 320, height: 240,
              borderRadius: 16, overflow: 'hidden',
              border: '3px solid #1B7A5A',
            }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
              <div style={{
                position: 'absolute', top: '50%', left: '10%', right: '10%',
                height: 2, background: '#E07A3A',
                animation: 'scanline 1.5s ease-in-out infinite alternate',
              }} />
            </div>
            <button
              onClick={stopCameraScanner}
              style={{
                marginTop: 20, padding: '12px 32px',
                background: '#E07A3A', color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <style>{"@keyframes scanline { from { top: 30%; } to { top: 70%; } }"}</style>
          </div>
        )}

        {/* Product grid */}
        <div style={S.grid}>
          {searching && (
            <div style={S.emptySearch}>Buscando...</div>
          )}

          {!searching && results.length === 0 && query.trim() && (
            <div style={S.emptySearch}>No se encontraron productos</div>
          )}

          {!searching && results.length === 0 && !query.trim() && (
            <div style={S.emptySearch}>
              <FiSearch style={{ fontSize: 48, opacity: 0.2, marginBottom: 10 }} />
              <div>Escribe el nombre o escanea el codigo de barras</div>
            </div>
          )}

          {results.map((p) => (
            <ProductCard
              key={p.id}
              producto={p}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>
      </div>

      {/* ===== RIGHT: Cart ===== */}
      <div style={S.right}>
        {/* Cart header */}
        <div style={S.cartHeader}>
          <div style={S.cartTitle}>
            <FiShoppingCart style={{ fontSize: 24 }} />
            Carrito
            {itemCount > 0 && (
              <span style={S.cartBadge}>{itemCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, color: 'var(--text-light)', fontWeight: 500 }}>
              {cart.length} producto{cart.length !== 1 ? 's' : ''}
            </span>
            {historial.length > 0 && (
              <button
                onClick={() => setShowHistorial(!showHistorial)}
                style={{
                  background: showHistorial ? '#1B7A5A' : 'transparent',
                  color: showHistorial ? '#fff' : '#1B7A5A',
                  border: '2px solid #1B7A5A',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Ver ventas recientes"
              >
                <FiClock size={14} />
                {historial.length}
              </button>
            )}
          </div>
        </div>

        {/* Cart items */}
        {cart.length === 0 ? (
          <div style={S.cartEmpty}>
            <FiShoppingCart style={S.cartEmptyIcon} />
            <div style={{ fontSize: 17 }}>El carrito esta vacio</div>
            <div style={{ fontSize: 14 }}>Busca un producto para empezar</div>
          </div>
        ) : (
          <div style={S.cartList}>
            {cart.map((item) => (
              <div key={item.producto.id} style={S.cartItem}>
                <div style={S.cartItemInfo}>
                  <div style={S.cartItemName}>{item.producto.nombre}</div>
                  <div style={S.cartItemPrice}>
                    {formatMoney(item.precioUnitario)} c/u
                  </div>
                </div>

                {/* Qty controls */}
                <div style={S.qtyControls}>
                  <button
                    style={S.qtyBtn}
                    onClick={() => updateQty(item.producto.id, -1)}
                    aria-label="Menos"
                  >
                    <FiMinus />
                  </button>
                  <span style={S.qtyValue}>{item.cantidad}</span>
                  <button
                    style={S.qtyBtn}
                    onClick={() => updateQty(item.producto.id, 1)}
                    aria-label="Mas"
                  >
                    <FiPlus />
                  </button>
                </div>

                {/* Subtotal */}
                <div style={S.cartItemSubtotal}>
                  {formatMoney(item.cantidad * item.precioUnitario)}
                </div>

                {/* Delete */}
                <button
                  style={S.deleteBtn}
                  onClick={() => removeFromCart(item.producto.id)}
                  aria-label="Eliminar"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Checkout footer */}
        <div style={S.footer}>
          {/* Total */}
          <div style={S.totalRow}>
            <span style={S.totalLabel}>TOTAL</span>
            <span style={S.totalAmount}>{formatMoney(total)}</span>
          </div>

          {/* Payment method buttons */}
          <div style={S.paymentRow}>
            {[
              { key: 'EFECTIVO', label: 'Efectivo', bg: '#1B7A5A' },
              { key: 'TARJETA', label: 'Tarjeta', bg: '#3B82F6' },
              { key: 'FIADO', label: 'Fiado', bg: '#E07A3A' },
            ].map((m) => {
              const isSelected = metodo === m.key;
              const hasSelection = metodo !== null;
              return (
                <button
                  key={m.key}
                  style={{
                    ...S.payBtn,
                    background: m.bg,
                    ...(isSelected
                      ? { ...S.payBtnSelected, borderColor: '#fff', boxShadow: `0 0 0 2px ${m.bg}` }
                      : hasSelection
                        ? S.payBtnUnselected
                        : {}),
                  }}
                  onClick={() => handleMetodo(m.key)}
                >
                  {m.key === 'FIADO' && <FiUser style={{ marginRight: 4 }} />}
                  {m.label}
                  {m.key === 'FIADO' && selectedClient && (
                    <span style={{ fontSize: 12, display: 'block', fontWeight: 400 }}>
                      {selectedClient.nombre}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Change calculator for cash */}
          {metodo === 'EFECTIVO' && cart.length > 0 && (
            <div style={{
              background: '#F5F0EB',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1810' }}>💵 Pago con:</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: '#1B7A5A' }}>$</span>
                  <input
                    type="number"
                    value={recibido}
                    onChange={(e) => {
                      setRecibido(e.target.value);
                      const r = parseFloat(e.target.value);
                      setCambio(r > total ? r - total : 0);
                    }}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 28px',
                      border: '2px solid #1B7A5A',
                      borderRadius: 8,
                      fontSize: 18,
                      fontWeight: 700,
                      outline: 'none',
                      background: '#fff',
                      color: '#2C1810',
                    }}
                    autoComplete="off"
                  />
                </div>
              </div>
              {recibido && parseFloat(recibido) > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: parseFloat(recibido) >= total ? '#E8F5E9' : '#FFF3E0',
                  marginTop: 4,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: parseFloat(recibido) >= total ? '#1B7A5A' : '#E07A3A' }}>
                    {parseFloat(recibido) >= total ? '🔄 Cambio:' : '⚠️ Falta:'}
                  </span>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: parseFloat(recibido) >= total ? '#1B7A5A' : '#E07A3A',
                  }}>
                    {formatMoney(Math.abs(parseFloat(recibido) - total))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cobrar button */}
          <button
            style={{
              ...S.cobrarBtn,
              ...(canCheckout ? {} : S.cobrarDisabled),
            }}
            disabled={!canCheckout}
            onClick={handleCobrar}
          >
            {submitting ? 'Procesando...' : `COBRAR ${formatMoney(total)}`}
          </button>
        </div>
      </div>

      {/* ===== Historial de ventas ===== */}
      {showHistorial && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowHistorial(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '90%',
              maxWidth: 500,
              maxHeight: '80vh',
              overflow: 'auto',
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#2C1810' }}>
                <FiClock style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Ventas Recientes
              </h2>
              <button
                onClick={() => setShowHistorial(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>

            {historial.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>No hay ventas registradas</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historial.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      border: '1px solid #E8E0D8',
                      borderRadius: 12,
                      padding: '12px 16px',
                      background: '#FDFBF9',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, color: '#666' }}>{v.fecha}</span>
                        <span style={{ fontSize: 14, color: '#999', marginLeft: 8 }}>{v.hora}</span>
                      </div>
                      <span style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 600,
                        background: v.metodo === 'EFECTIVO' ? '#E8F5E9' : v.metodo === 'TARJETA' ? '#E3F2FD' : '#FFF3E0',
                        color: v.metodo === 'EFECTIVO' ? '#1B7A5A' : v.metodo === 'TARJETA' ? '#1565C0' : '#E07A3A',
                      }}>
                        {v.metodo === 'EFECTIVO' ? 'Efectivo' : v.metodo === 'TARJETA' ? 'Tarjeta' : 'Fiado'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                      {v.items.map(i => i.producto.nombre).join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#1B7A5A' }}>
                        {formatMoney(v.total)}
                      </span>
                      <button
                        onClick={() => {
                          imprimirTicket(v.items, v.total, v.metodo, v.cambio);
                        }}
                        style={{
                          background: '#1B7A5A',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <FiPrinter size={14} />
                        Reimprimir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Success animation overlay ===== */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(27, 122, 90, 0.15)',
            zIndex: 2000,
            pointerEvents: 'none',
            animation: 'posSuccessFade 1.2s ease-in-out',
          }}
        >
          <div
            style={{
              fontSize: 80,
              animation: 'posSuccessPop 0.4s ease-out',
            }}
          >
            &#10003;
          </div>
        </div>
      )}

      {/* ===== Client modal for Fiado ===== */}
      {showClientModal && (
        <div
          style={S.overlay}
          onClick={() => setShowClientModal(false)}
        >
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span>Seleccionar Cliente</span>
              <button
                style={S.modalClose}
                onClick={() => setShowClientModal(false)}
              >
                Cerrar
              </button>
            </div>

            <div style={S.modalSearch}>
              <input
                type="text"
                value={clientSearch}
                onChange={handleClientSearchChange}
                placeholder="Buscar por nombre..."
                style={S.modalSearchInput}
                autoFocus
              />
            </div>

            <div style={S.modalList}>
              {loadingClients && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)' }}>
                  Buscando clientes...
                </div>
              )}

              {!loadingClients && clients.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)' }}>
                  No se encontraron clientes
                </div>
              )}

              {clients.map((c) => (
                <div
                  key={c.id}
                  style={S.clientRow}
                  onClick={() => selectClient(c)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={S.clientIcon}>
                    <FiUser />
                  </div>
                  <span>{c.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes posSuccessFade {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes posSuccessPop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────── ProductCard sub-component ─────────────── */

function ProductCard({ producto, onAdd }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        ...S.productCard,
        ...(pressed ? S.productCardActive : {}),
      }}
      onClick={onAdd}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
    >
      <div style={S.productName}>{producto.nombre}</div>
      <div style={S.productPrice}>{formatMoney(producto.precioVenta ?? producto.precio)}</div>
      <div style={S.productStock}>
        Stock: {producto.stock ?? producto.cantidad ?? '---'}
      </div>
    </div>
  );
}
