/**
 * Formulario de registro de cliente y vehículo
 *
 * Valida los datos en el navegador (cédula con módulo 10 y placa ecuatoriana)
 * y los envía a la API, que vuelve a validarlos. Lo usan el administrador y el guardia.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { clientesApi } from '../../api/servicios';
import { erroresPorCampo } from '../../api/http';
import { Boton, Campo, Modal } from '../ui';
import { TIPOS_VEHICULO, esCedulaValida, esPlacaValida, normalizarPlaca } from '../../utils/constantes';

/** Formulario reutilizable (admin y guardia) para registrar un cliente con su vehículo. */
const VACIO = { nombres: '', cedula: '', correo: '', telefono: '', placa: '', tipo: 'AUTO' };

export default function FormularioCliente({ alCerrar, alGuardar, placaInicial = '', tipoInicial }) {
  const [form, setForm] = useState({ ...VACIO, placa: placaInicial, tipo: tipoInicial || 'AUTO' });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const cambiar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  function validar() {
    const e = {};
    if (form.nombres.trim().length < 3) e.nombres = 'El nombre debe tener al menos 3 caracteres';
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/.test(form.nombres.trim())) e.nombres = 'Solo letras y espacios';
    if (form.cedula && !/^\d{10}$/.test(form.cedula)) e.cedula = `La cédula debe tener exactamente 10 dígitos (${form.cedula.length}/10)`;
    else if (form.cedula && !esCedulaValida(form.cedula)) e.cedula = 'La cédula no es válida (dígito verificador incorrecto)';
    if (form.telefono && !/^(09\d{8}|\+5939\d{8})$/.test(form.telefono)) e.telefono = 'Formato: 09XXXXXXXX';
    if (form.placa && !esPlacaValida(normalizarPlaca(form.placa))) e.placa = 'Placa no válida (auto ABC-1234 · moto AB123C)';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function guardar(ev) {
    ev.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    try {
      const cuerpo = {
        nombres: form.nombres.trim(), cedula: form.cedula || null, correo: form.correo || null, telefono: form.telefono || null,
        ...(form.placa ? { vehiculo: { placa: normalizarPlaca(form.placa), tipo: form.tipo } } : {}),
      };
      const r = await clientesApi.crear(cuerpo);
      toast.success(r.mensaje);
      alGuardar(r.datos);
    } catch (e) {
      const porCampo = erroresPorCampo(e);
      if (e.codigo === 'DUPLICADO' && /placa/i.test(e.mensaje)) porCampo.placa = e.mensaje;
      if (e.codigo === 'DUPLICADO' && /cédula/i.test(e.mensaje)) porCampo.cedula = e.mensaje;
      setErrores({ ...porCampo, placa: porCampo.placa || porCampo['vehiculo.placa'] });
      toast.error(e.mensaje);
    } finally { setGuardando(false); }
  }

  return (
    <Modal abierto titulo="Registrar cliente y vehículo" alCerrar={alCerrar} ancho="max-w-xl"
      pie={<><Boton variante="secundario" onClick={alCerrar}>Cancelar</Boton><Boton type="submit" form="form-cliente" cargando={guardando}>Guardar cliente</Boton></>}>
      <form id="form-cliente" onSubmit={guardar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" etiqueta="Nombre completo" required value={form.nombres} onChange={cambiar('nombres')} error={errores.nombres} placeholder="María Guamán" />
        <Campo etiqueta="Cédula" inputMode="numeric" maxLength={10} value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value.replace(/\D/g, '') })} error={errores.cedula} placeholder="0104567896" />
        <Campo etiqueta="Teléfono celular" value={form.telefono} onChange={cambiar('telefono')} error={errores.telefono} placeholder="0987654321" />
        <Campo etiqueta="Placa del vehículo" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} onBlur={() => setForm((f) => ({ ...f, placa: normalizarPlaca(f.placa) }))} error={errores.placa} placeholder="ABA-1234" />
        <Campo como="select" etiqueta="Tipo de vehículo" opciones={TIPOS_VEHICULO} value={form.tipo} onChange={cambiar('tipo')} />
      </form>
    </Modal>
  );
}
