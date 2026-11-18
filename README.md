# SmartPark · Estacionamiento inteligente

Aplicación web Full Stack para administrar un estacionamiento con **lectura de placas por cámara**, **asignación automática de espacios**, **tarifa dinámica**, **ticket con código QR** y **panel en tiempo real**.

- **Estudiante:** Kevin Stalin Marca Gutama
- **Caso 15:** Estacionamientos inteligentes
- **Materia:** Programación Web, 5A. Universidad Católica de Cuenca
- **Docente:** Ing. Luis Fernando Pinos Castillo

---

## 1. Tecnologías

| Capa | Tecnología | Por qué |
|---|---|---|
| Base de datos | **PostgreSQL** | Transacciones ACID, bloqueos de fila (`FOR UPDATE`), índices únicos parciales y JSONB para la auditoría |
| Backend | **Node.js + Express 5** | API REST liviana con manejo nativo de errores asíncronos |
| Validación | **Zod** | Esquemas declarativos con mensajes en español |
| Seguridad | **JWT + bcrypt + roles** | Sesión sin estado, contraseñas con hash y permisos verificados en el backend |
| Tiempo real | **Socket.io** | El panel se actualiza sin recargar la página |
| Frontend | **React 18 + Vite + Tailwind CSS** | Componentes reutilizables y el diseño de Stitch |
| Gráficos | **Recharts** | Indicadores y reportes |
| Cámara | **html5-qrcode** + **Plate Recognizer API** | Lectura del QR y de las placas |
| Documentos | **PDFKit**, **qrcode**, **Nodemailer** | Comprobantes en PDF, QR y envío de correos |
| Documentación | **Swagger / OpenAPI 3** | `/api/docs` |

## 2. Estructura del proyecto

```
smartpark/
├── database/
│   ├── schema.sql          # tablas, restricciones e índices
│   └── seed.sql            # datos de prueba de Cuenca, Ecuador
├── backend/
│   ├── src/
│   │   ├── config/         # variables de entorno y conexión (pool + transacciones)
│   │   ├── middlewares/    # autenticación, roles, validación y errores
│   │   ├── modules/        # un módulo por entidad:
│   │   │   └── sesiones/   #   routes → controller → service → repository + schemas
│   │   ├── services/       # QR, PDF, correo, Socket.io y lectura de placas
│   │   ├── utils/          # calculadora de tarifa, validadores (cédula y placa), paginación
│   │   └── docs/openapi.js # Swagger
│   └── tests/              # pruebas unitarias (node --test)
├── frontend/
│   └── src/
│       ├── api/            # cliente HTTP (axios) y servicios
│       ├── components/     # ui/ (reutilizables) y parqueadero/ (mapa, QR, cámara)
│       ├── context/        # sesión del usuario
│       ├── hooks/          # useApi, useListado (filtros y paginación), useTiempoReal
│       ├── layouts/        # Admin (escritorio) y Guardia (móvil)
│       ├── pages/          # admin/, guardia/, publico/, errores/
│       └── routes/         # protección de rutas por rol
└── docs/
    ├── SmartPark.postman_collection.json   # 27 pruebas del examen
    └── MODELO_DATOS.md
```

## 3. Instalación local

**Requisitos:** Node.js 18 o superior y PostgreSQL 14 o superior.

### 3.1 Base de datos
Cree una base de datos vacía llamada `smartpark` (en pgAdmin o con `createdb smartpark`).

### 3.2 Backend
```bash
cd backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
# edite .env: DATABASE_URL con su usuario y contraseña de PostgreSQL, y un JWT_SECRET largo
npm run db:init             # crea las tablas y carga los datos de prueba
npm run dev                 # http://localhost:4000  ·  Swagger: http://localhost:4000/api/docs
```

### 3.3 Frontend
```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm run dev                 # http://localhost:5173
```

### 3.4 Usuarios de prueba
| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `Admin123*` |
| Guardia | `guardia` | `Guardia123*` |

> La cámara del navegador solo funciona en **HTTPS** o en **localhost**. Para probar con el celular use la versión desplegada (Vercel ya trae HTTPS).

### 3.5 Funciones opcionales (variables de entorno del backend)
- **Correo con el ticket QR:** `SMTP_USER` y `SMTP_PASS` (Gmail con *contraseña de aplicación*).
- **Lectura de placas con cámara:** `PLATE_RECOGNIZER_TOKEN` (cuenta gratuita en platerecognizer.com).

Si se dejan vacías el sistema funciona igual: no envía correos y el guardia escribe la placa a mano.

## 4. Roles y permisos (verificados en el backend)

| Acción | Admin | Guardia |
|---|:-:|:-:|
| Registrar entradas, salidas y cobros | ✅ | ✅ |
| Ver mapa y tarifa vigente; registrar clientes | ✅ | ✅ |
| Modificar tarifas y reglas dinámicas | ✅ | ❌ 403 |
| Gestionar espacios y anular sesiones | ✅ | ❌ 403 |
| Reportes de ingresos, auditoría y usuarios | ✅ | ❌ 403 |

## 5. Modelo de datos (9 tablas)

`usuarios`, `clientes`, `vehiculos`, `espacios`, `tarifas`, `reglas_tarifa`, `sesiones`, `pagos` y `auditoria`. El detalle y el diagrama entidad-relación están en [docs/MODELO_DATOS.md](docs/MODELO_DATOS.md).

## 6. Reglas de negocio

| # | Regla | Dónde se controla |
|---|---|---|
| 1 | No asignar un espacio **ocupado o inhabilitado** | `sesiones.service.registrarEntrada` → 422 `ESPACIO_OCUPADO` / `ESPACIO_INHABILITADO` |
| 2 | Un vehículo no puede tener **dos sesiones abiertas** | Servicio (409) + índice único parcial `uq_sesion_abierta_vehiculo` |
| 3 | La **salida** debe corresponder a un **ingreso activo** | `validarAbierta()` → 409 `TICKET_CERRADO` |
| 4 | La **tarifa se calcula en el backend** con reglas configurables | `utils/calculadoraTarifa.js` + tablas `tarifas` y `reglas_tarifa` |
| 5 | La **disponibilidad se actualiza** al registrar la entrada y la salida | En la misma transacción de la entrada o la salida |
| 6 | El tipo de espacio debe ser **compatible** con el vehículo | `utils/compatibilidad.js` → 422 `ESPACIO_INCOMPATIBLE` |
| 7 | Un ticket **no se cobra dos veces** | `FOR UPDATE` + `UNIQUE (pagos.sesion_id)` |
| 8 | No se puede **inhabilitar un espacio ocupado** ni eliminar uno con historial | `espacios.service` |
| 9 | Placa ecuatoriana válida y **cédula con dígito verificador** (módulo 10) | `utils/validadores.js` |
| 10 | Siempre debe existir **al menos un administrador activo** | `usuarios.service` |

## 7. Transacciones y concurrencia

- **Entrada:** se bloquea el vehículo (`FOR UPDATE`), se toma el espacio con `FOR UPDATE SKIP LOCKED`, se crea la sesión, se marca el espacio y se audita, todo en una sola transacción. Si dos guardias registran entradas al mismo tiempo, cada uno recibe **un espacio distinto**.
- **Salida y pago:** se bloquea la sesión (`FOR UPDATE`). El pago, el cierre de la sesión y la liberación del espacio ocurren juntos o no ocurre nada (`ROLLBACK`). Si dos personas cobran el mismo ticket a la vez, el segundo recibe *"Ticket ya cerrado"*.
- **Registro de cliente con vehículo:** si la placa pertenece a otro cliente se revierte todo y no queda el cliente a medias.

## 8. Innovaciones

1. **Reconocimiento automático de placas (LPR)** con la cámara y la API de Plate Recognizer (integración con un servicio externo).
2. **Asignación automática de espacios** según el tipo de vehículo y la cercanía a la entrada, con **tarifa dinámica** por alta demanda, hora pico, horario nocturno y cliente frecuente.
3. **Ticket digital con QR**: se escanea en la salida, se envía por correo (notificación automática) y tiene una página pública con el contador y el valor acumulado en vivo.
4. **Panel en tiempo real** (Socket.io): el mapa de espacios y los indicadores cambian al instante.
5. **Comprobantes y reportes en PDF**, panel de indicadores, mapa de calor de horas pico y clientes frecuentes.

## 9. Pruebas

- **Postman:** importe `docs/SmartPark.postman_collection.json` y ejecute la colección completa (*Run collection*). Incluye 27 peticiones: escenarios correctos, errores, acceso no autorizado, reglas de negocio y duplicidad.
- **Pruebas unitarias** de la calculadora de tarifas y los validadores: `cd backend && npm test`.
- **Swagger:** `http://localhost:4000/api/docs`.

## 10. Despliegue (referencial)

| Parte | Plataforma | Configuración |
|---|---|---|
| Base de datos | Railway (PostgreSQL) | Copiar `DATABASE_URL` y ejecutar `npm run db:init` apuntando a esa URL |
| Backend | Railway o Render | Root: `backend`, start: `npm start`, variables del `.env` con `DB_SSL=true` y `FRONTEND_URL` del frontend |
| Frontend | Vercel | Root: `frontend`, variable `VITE_API_URL` con la URL del backend (`vercel.json` ya incluye la regla para las rutas de React) |

> **Seguridad:** los archivos `.env` están en `.gitignore`. Nunca suba contraseñas ni tokens al repositorio.
