import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Alerta, Boton } from '../../components/ui';
import Logo from '../../components/Logo';

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/guardia'} replace />;

  function validar() {
    const e = {};
    if (form.usuario.trim().length < 3) e.usuario = 'Ingrese su usuario o correo';
    if (!form.password) e.password = 'Ingrese su contraseña';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(ev) {
    ev.preventDefault();
    setErrorGeneral('');
    if (!validar()) return;
    setEnviando(true);
    try {
      const u = await iniciarSesion(form.usuario.trim(), form.password);
      const destino = ubicacion.state?.desde;
      navegar(destino && !destino.startsWith('/login') ? destino : (u.rol === 'ADMIN' ? '/admin' : '/guardia'), { replace: true });
    } catch (e) {
      setErrorGeneral(e.mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-marino p-10 text-white lg:flex">
        <img src="/parqueadero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-marino-oscuro via-marino-oscuro/70 to-transparent" />
        <div className="relative"><Logo /></div>
        <div className="relative max-w-lg">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Plataforma de control de acceso vehicular</span>
          <h1 className="text-4xl font-extrabold leading-tight">Gestión inteligente, rápida y segura en cada acceso.</h1>
          <p className="mt-4 text-blue-100">Reconocimiento automático de placas, asignación de espacios, tarifa dinámica en tiempo real y tickets con código QR.</p>
        </div>
        <p className="relative text-xs text-blue-200">© 2026 SmartPark – Cuenca, Ecuador</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo claro={false} /></div>
          <h2 className="text-2xl font-bold text-tinta">Iniciar sesión</h2>
          <p className="mb-6 text-sm text-slate-500">Ingrese sus credenciales para acceder al sistema.</p>

          <form onSubmit={enviar} noValidate className="space-y-4">
            <div>
              <label htmlFor="usuario" className="etiqueta">Usuario o correo</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input id="usuario" autoComplete="username" className={`entrada pl-9 ${errores.usuario ? 'entrada-error' : ''}`}
                  value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} placeholder="usuario o correo" />
              </div>
              {errores.usuario && <p className="mt-1 text-xs text-ocupado-oscuro" role="alert">{errores.usuario}</p>}
            </div>
            <div>
              <label htmlFor="password" className="etiqueta">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input id="password" type={verPassword ? 'text' : 'password'} autoComplete="current-password"
                  className={`entrada pl-9 pr-10 ${errores.password ? 'entrada-error' : ''}`}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setVerPassword(!verPassword)} aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errores.password && <p className="mt-1 text-xs text-ocupado-oscuro" role="alert">{errores.password}</p>}
            </div>

            {errorGeneral && <Alerta titulo="Error de autenticación">{errorGeneral}</Alerta>}

            <Boton type="submit" cargando={enviando} className="w-full" tamano="lg">{enviando ? 'Ingresando...' : 'Ingresar'}</Boton>
          </form>
        </div>
      </section>
    </div>
  );
}