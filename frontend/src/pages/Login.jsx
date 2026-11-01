import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiShoppingCart, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Escribe tu usuario y contraseña');
      return;
    }
    setCargando(true);
    try {
      await login(username, password);
      toast.success('¡Bienvenido!');
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Usuario o contraseña incorrectos';
      toast.error(msg);
    }
    setCargando(false);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <FiShoppingCart size={40} />
          </div>
          <h1 style={S.title}>Abarrotes Lirios</h1>
          <p style={S.subtitle}>Sistema de Punto de Venta</p>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.inputGroup}>
            <FiUser size={20} style={S.inputIcon} />
            <input
              style={S.input}
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div style={S.inputGroup}>
            <FiLock size={20} style={S.inputIcon} />
            <input
              style={S.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              style={S.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            style={{
              ...S.submitBtn,
              opacity: cargando ? 0.7 : 1,
            }}
            disabled={cargando}
          >
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={S.hint}>
          Primera vez? Usuario: <strong>admin</strong> / Contraseña: <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}

const S = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FEF7ED 0%, #FAF5EE 50%, #F0E6D8 100%)',
    padding: '20px',
  },
  card: {
    backgroundColor: '#FEFCF9',
    borderRadius: '24px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 32px rgba(44, 24, 16, 0.1)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logoIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    backgroundColor: '#1B7A5A',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '26px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    color: '#2C1810',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#8B7355',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#B8A089',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    fontSize: '16px',
    border: '2px solid #F0E6D8',
    borderRadius: '14px',
    outline: 'none',
    backgroundColor: '#FEF7ED',
    color: '#2C1810',
    minHeight: '52px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#B8A089',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    backgroundColor: '#1B7A5A',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    minHeight: '56px',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  hint: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#B8A089',
    marginTop: '24px',
    marginBottom: 0,
  },
};
