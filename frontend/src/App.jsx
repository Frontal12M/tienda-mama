import { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiShoppingCart, FiPackage, FiUsers, FiBarChart2, FiShoppingBag, FiLogOut, FiClipboard } from 'react-icons/fi';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PuntoDeVenta from './pages/PuntoDeVenta';
import Inventario from './pages/Inventario';
import Fiados from './pages/Fiados';
import Reportes from './pages/Reportes';
import ListaCompras from './pages/ListaCompras';
import Dashboard from './pages/Dashboard';
import CorteDeCaja from './pages/CorteDeCaja';

const navItems = [
  { path: '/', label: 'Inicio', icon: FiHome },
  { path: '/ventas', label: 'Ventas', icon: FiShoppingCart },
  { path: '/inventario', label: 'Inventario', icon: FiPackage },
  { path: '/fiados', label: 'Fiados', icon: FiUsers },
  { path: '/reportes', label: 'Reportes', icon: FiBarChart2 },
  { path: '/corte', label: 'Corte', icon: FiClipboard },
  { path: '/compras', label: 'Compras', icon: FiShoppingBag },
];

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-light)' }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={styles.layout}>
      {/* Desktop Sidebar */}
      <nav
        className="sidebar-desktop"
        style={{
          ...styles.sidebar,
          width: sidebarExpanded ? 220 : 80,
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div style={styles.sidebarHeader}>
          {sidebarExpanded ? (
            <span style={styles.storeName}>Abarrotes Lirios</span>
          ) : (
            <span style={styles.storeIcon}>AL</span>
          )}
        </div>

        <div style={styles.navList}>
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                }}
              >
                <item.icon size={24} />
                {sidebarExpanded && (
                  <span style={styles.navLabel}>{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User info + logout at bottom of sidebar */}
        <div style={styles.sidebarFooter}>
          {sidebarExpanded && (
            <span style={styles.userName}>{user.nombre}</span>
          )}
          <button
            onClick={logout}
            style={{
              ...styles.logoutBtn,
              justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            }}
            title="Cerrar Sesion"
          >
            <FiLogOut size={20} />
            {sidebarExpanded && <span>Salir</span>}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main" style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ventas" element={<PuntoDeVenta />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/fiados" element={<Fiados />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/corte" element={<CorteDeCaja />} />
          <Route path="/compras" element={<ListaCompras />} />
        </Routes>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="bottom-bar-mobile" style={styles.bottomBar}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                ...styles.bottomItem,
                color: isActive ? 'var(--primary)' : 'var(--text-light)',
              }}
            >
              <item.icon size={24} />
              <span style={styles.bottomLabel}>{item.label}</span>
            </NavLink>
          );
        })}
        <button onClick={logout} style={{ ...styles.bottomItem, color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <FiLogOut size={24} />
          <span style={styles.bottomLabel}>Salir</span>
        </button>
      </nav>

      <style>{responsiveCSS}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const responsiveCSS = `
  .bottom-bar-mobile { display: none !important; }

  @media (max-width: 767px) {
    .sidebar-desktop { display: none !important; }
    .bottom-bar-mobile { display: flex !important; }
    .app-main { margin-left: 0 !important; padding-bottom: 80px !important; }
  }
`;

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    backgroundColor: '#2C1810',
    borderRight: 'none',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
    zIndex: 100,
    boxShadow: '2px 0 12px rgba(44, 24, 16, 0.15)',
  },
  sidebarHeader: {
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '0 16px',
    flexShrink: 0,
  },
  storeName: {
    fontSize: 16,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    color: '#FEF7ED',
    whiteSpace: 'nowrap',
  },
  storeIcon: {
    fontSize: 20,
    fontWeight: 800,
    color: '#FEF7ED',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '16px 12px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 'var(--radius)',
    color: 'rgba(212, 196, 176, 0.7)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    minHeight: 48,
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    backgroundColor: 'rgba(27, 122, 90, 0.2)',
    color: '#22956E',
  },
  navLabel: {
    overflow: 'hidden',
  },
  sidebarFooter: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '12px',
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(212,196,176,0.6)',
    display: 'block',
    padding: '4px 16px 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'none',
    color: '#E07A3A',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.15s',
  },
  main: {
    flex: 1,
    marginLeft: 80,
    minHeight: '100vh',
    paddingBottom: 0,
  },
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: 'var(--card)',
    borderTop: '2px solid var(--border)',
    display: 'flex', // visibility controlled by className + CSS media query
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
  },
  bottomItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: 600,
    padding: '8px 4px',
    minWidth: 56,
    minHeight: 48,
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: 600,
  },
};
