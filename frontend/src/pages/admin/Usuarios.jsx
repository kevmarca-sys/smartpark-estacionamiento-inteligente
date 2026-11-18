/**
 * Página de usuarios (administrador)
 *
 * Gestión de las cuentas del personal y matriz de permisos por rol.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Lock, Pencil, UserPlus } from 'lucide-react';
import { usuariosApi } from '../../api/servicios';
import { erroresPorCampo } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import useListado from '../../hooks/useListado';
import {
  Boton, Campo, Cargando, Confirmar, EncabezadoPagina, ErrorCarga, EstadoVacio, Insignia, Modal, Paginacion, Tabla,
} from '../../components/ui';
import { fechaHora } from '../../utils/formato';

const ROLES = [{ valor: 'GUARDIA', texto: 'Guardia' }, { valor: 'ADMIN', texto: 'Administrador' }];
const PERMISOS = [
  ['Registrar entradas y salidas', true, true],
  ['Cobrar y emitir comprobantes', true, true],
  ['Ver mapa y tarifa vigente', true, true],
  ['Registrar clientes', true, true],
  ['Modificar tarifas y reglas', true, false],
  ['Gestionar espacios', true, false],
  ['Anular sesiones', true, false],
  ['Ver reportes de ingresos', true, false],
  ['Ver auditoría', true, false],
  ['Gestionar usuarios', true, false],
];

function fuerza(p) {
  let n = 0;
  if (p.length >= 8) n += 1;
  if (/[A-Z]/.test(p)) n += 1;
  if (/\d/.test(p)) n += 1;
  if (/[^A-Za-z0-9]/.test(p)) n += 1;
  return n;
}

function FormularioUsuario({ usuario, alCerrar, alGuardar }) {
  const editando = Boolean(usuario?.id);
  const [form, setForm] = useState({ nombre: usuario?.nombre || '', usuario: usuario?.usuario || '', correo: usuario?.correo || '', password: '', rol: usuario?.rol || 'GUARDIA' });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const f = fuerza(form.password);
  const cambiar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  async function guardar(ev) {
    ev.preventDefault();
    const e = {};
    if (form.nombre.trim().length < 3) e.nombre = 'Mínimo 3 caracteres';
    if (!editando && !/^[a-z0-9._]{3,50}$/i.test(form.usuario)) e.usuario = 'Solo letras, números, punto o guion bajo';
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) e.correo = 'Correo no válido';
    if ((!editando || form.password) && (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/\d/.test(form.password))) e.password = 'Mínimo 8 caracteres, una mayúscula y un número';
    setErrores(e);
    if (Object.keys(e).length) return;
    setGuardando(true);
    try {
      const cuerpo = editando
        ? { nombre: form.nombre, correo: form.correo, rol: form.rol, ...(form.password ? { password: form.password } : {}) }
        : form;
      const r = editando ? await usuariosApi.actualizar(usuario.id, cuerpo) : await usuariosApi.crear(cuerpo);
      toast.success(r.mensaje);
      alGuardar();
    } catch (ex) { setErrores(erroresPorCampo(ex)); toast.error(ex.mensaje); } finally { setGuardando(false); }
  }

  return (
    <Modal abierto titulo={editando ? `Editar ${usuario.nombre}` : 'Nuevo usuario'} alCerrar={alCerrar}
      pie={<><Boton variante="secundario" onClick={alCerrar}>Cancelar</Boton><Boton type="submit" form="form-usuario" cargando={guardando}>Guardar</Boton></>}>
      <form id="form-usuario" onSubmit={guardar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" etiqueta="Nombre completo" required value={form.nombre} onChange={cambiar('nombre')} error={errores.nombre} />
        <Campo etiqueta="Usuario" required disabled={editando} value={form.usuario} onChange={cambiar('usuario')} error={errores.usuario} />
        <Campo como="select" etiqueta="Rol" opciones={ROLES} value={form.rol} onChange={cambiar('rol')} error={errores.rol} />
        <Campo className="sm:col-span-2" type="email" etiqueta="Correo" required value={form.correo} onChange={cambiar('correo')} error={errores.correo} />
        <div className="sm:col-span-2">
          <Campo type="password" etiqueta={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'} required={!editando} value={form.password} onChange={cambiar('password')} error={errores.password} autoComplete="new-password" />
          {form.password && (
            <div className="mt-2 flex gap-1" aria-label={`Seguridad de la contraseña: ${f} de 4`}>
              {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= f ? (f >= 3 ? 'bg-libre' : 'bg-alerta') : 'bg-slate-200'}`} />)}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const lista = useListado(usuariosApi.listar, { filtrosIniciales: { q: '', rol: '', activo: '' }, ordenInicial: { ordenarPor: 'nombre', direccion: 'asc' } });
  const [formulario, setFormulario] = useState(null);
  const [cambioEstado, setCambioEstado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  async function confirmarEstado() {
    setProcesando(true);
    try {
      const r = await usuariosApi.actualizar(cambioEstado.id, { activo: !cambioEstado.activo });
      toast.success(r.mensaje);
      setCambioEstado(null);
      lista.recargar({ silencioso: true });
    } catch (e) { toast.error(e.mensaje); } finally { setProcesando(false); }
  }

  const columnas = [
    { clave: 'nombre', titulo: 'Nombre', ordenable: true, render: (u) => <div><p className="font-semibold">{u.nombre}{u.id === yo.id && <span className="ml-1 text-xs text-slate-400">(usted)</span>}</p><p className="text-xs text-slate-500">{u.correo}</p></div> },
    { clave: 'usuario', titulo: 'Usuario', render: (u) => <span className="font-mono text-xs">{u.usuario}</span> },
    { clave: 'rol', titulo: 'Rol', ordenable: true, render: (u) => <Insignia color={u.rol === 'ADMIN' ? 'marino' : 'azul'}>{u.rol === 'ADMIN' ? 'Administrador' : 'Guardia'}</Insignia> },
    { clave: 'activo', titulo: 'Estado', render: (u) => <Insignia punto color={u.activo ? 'verde' : 'gris'}>{u.activo ? 'Activo' : 'Inactivo'}</Insignia> },
    { clave: 'ultimo_acceso', titulo: 'Último acceso', ordenable: true, render: (u) => fechaHora(u.ultimo_acceso) },
    {
      clave: 'acciones', titulo: '', render: (u) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => setFormulario(u)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label={`Editar ${u.nombre}`}><Pencil className="h-4 w-4" /></button>
          {u.id !== yo.id && <Boton tamano="sm" variante={u.activo ? 'secundario' : 'exito'} onClick={() => setCambioEstado(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Boton>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina titulo="Usuarios y permisos" descripcion="Personal con acceso al sistema" acciones={<Boton icono={UserPlus} onClick={() => setFormulario({})}>Nuevo usuario</Boton>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="tarjeta">
          <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
            <Campo placeholder="Buscar nombre, usuario o correo..." value={lista.filtros.q} onChange={(e) => lista.cambiarFiltro('q', e.target.value)} aria-label="Buscar" />
            <Campo como="select" value={lista.filtros.rol} onChange={(e) => lista.cambiarFiltro('rol', e.target.value)} aria-label="Rol" opciones={[{ valor: '', texto: 'Todos los roles' }, ...ROLES]} />
            <Campo como="select" value={lista.filtros.activo} onChange={(e) => lista.cambiarFiltro('activo', e.target.value)} aria-label="Estado" opciones={[{ valor: '', texto: 'Todos' }, { valor: 'true', texto: 'Activos' }, { valor: 'false', texto: 'Inactivos' }]} />
          </div>
          {lista.cargando ? <Cargando /> : lista.error ? <ErrorCarga error={lista.error} alReintentar={lista.recargar} />
            : lista.filas.length === 0 ? <EstadoVacio /> : <Tabla columnas={columnas} filas={lista.filas} orden={lista.orden} alOrdenar={lista.ordenarPor} />}
          <Paginacion paginacion={lista.paginacion} alCambiar={lista.setPagina} />
        </div>
        <div className="tarjeta p-5">
          <h2 className="mb-1 font-bold">Matriz de permisos</h2>
          <p className="mb-4 text-xs text-slate-500">Los permisos se verifican en el backend en cada petición.</p>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-500"><th className="pb-2 text-left font-semibold">Acción</th><th className="pb-2 font-semibold">Admin</th><th className="pb-2 font-semibold">Guardia</th></tr></thead>
            <tbody>
              {PERMISOS.map(([accion, admin, guardia]) => (
                <tr key={accion} className="border-t border-slate-100">
                  <td className="py-2 pr-2">{accion}</td>
                  <td className="text-center">{admin ? <Check className="mx-auto h-4 w-4 text-libre-oscuro" /> : <Lock className="mx-auto h-4 w-4 text-slate-400" />}</td>
                  <td className="text-center">{guardia ? <Check className="mx-auto h-4 w-4 text-libre-oscuro" /> : <Lock className="mx-auto h-4 w-4 text-slate-400" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {formulario && <FormularioUsuario usuario={formulario} alCerrar={() => setFormulario(null)} alGuardar={() => { setFormulario(null); lista.recargar({ silencioso: true }); }} />}
      <Confirmar abierto={Boolean(cambioEstado)} titulo={cambioEstado?.activo ? 'Desactivar usuario' : 'Activar usuario'} cargando={procesando}
        textoConfirmar={cambioEstado?.activo ? 'Desactivar' : 'Activar'} peligro={cambioEstado?.activo}
        mensaje={cambioEstado && (cambioEstado.activo ? `${cambioEstado.nombre} ya no podrá iniciar sesión.` : `${cambioEstado.nombre} podrá volver a iniciar sesión.`)}
        alConfirmar={confirmarEstado} alCancelar={() => setCambioEstado(null)} />
    </div>
  );
}
