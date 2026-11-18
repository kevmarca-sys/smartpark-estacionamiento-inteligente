-- =====================================================================
--  SmartPark - Estacionamiento inteligente (Cuenca, Ecuador)
--  Script de creación de la base de datos (PostgreSQL 14+)
--  Autor: Kevin Stalin Marca Gutama - Programación Web 5A
-- =====================================================================

DROP TABLE IF EXISTS auditoria      CASCADE;
DROP TABLE IF EXISTS pagos          CASCADE;
DROP TABLE IF EXISTS sesiones       CASCADE;
DROP TABLE IF EXISTS reglas_tarifa  CASCADE;
DROP TABLE IF EXISTS tarifas        CASCADE;
DROP TABLE IF EXISTS espacios       CASCADE;
DROP TABLE IF EXISTS vehiculos      CASCADE;
DROP TABLE IF EXISTS clientes       CASCADE;
DROP TABLE IF EXISTS usuarios       CASCADE;

-- ---------------------------------------------------------------------
-- USUARIOS del sistema (roles: ADMIN y GUARDIA)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    usuario         VARCHAR(50)  NOT NULL UNIQUE,
    correo          VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(100) NOT NULL,
    rol             VARCHAR(10)  NOT NULL CHECK (rol IN ('ADMIN', 'GUARDIA')),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso   TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- CLIENTES (opcionales: el cliente ocasional no necesita registrarse)
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id          SERIAL PRIMARY KEY,
    nombres     VARCHAR(120) NOT NULL,
    cedula      CHAR(10)     UNIQUE,
    correo      VARCHAR(120),
    telefono    VARCHAR(15),
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- VEHÍCULOS (1 cliente -> N vehículos). La placa es única.
-- ---------------------------------------------------------------------
CREATE TABLE vehiculos (
    id          SERIAL PRIMARY KEY,
    placa       VARCHAR(10)  NOT NULL UNIQUE,
    tipo        VARCHAR(15)  NOT NULL CHECK (tipo IN ('AUTO', 'MOTO', 'DISCAPACIDAD')),
    cliente_id  INTEGER      REFERENCES clientes(id) ON DELETE SET NULL,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vehiculos_cliente ON vehiculos(cliente_id);

-- ---------------------------------------------------------------------
-- ESPACIOS de estacionamiento
-- orden_cercania: menor número = más cerca de la entrada (asignación automática)
-- ---------------------------------------------------------------------
CREATE TABLE espacios (
    id              SERIAL PRIMARY KEY,
    codigo          VARCHAR(10)  NOT NULL UNIQUE,
    zona            VARCHAR(5)   NOT NULL,
    tipo            VARCHAR(15)  NOT NULL CHECK (tipo IN ('AUTO', 'MOTO', 'DISCAPACIDAD')),
    estado          VARCHAR(15)  NOT NULL DEFAULT 'LIBRE'
                    CHECK (estado IN ('LIBRE', 'OCUPADO', 'INHABILITADO')),
    orden_cercania  INTEGER      NOT NULL DEFAULT 100,
    motivo_inhabilitado VARCHAR(200),
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_espacios_estado ON espacios(estado, tipo, orden_cercania);

-- ---------------------------------------------------------------------
-- TARIFAS base por tipo de vehículo (configurables por el administrador)
-- ---------------------------------------------------------------------
CREATE TABLE tarifas (
    id                SERIAL PRIMARY KEY,
    tipo_vehiculo     VARCHAR(15)   NOT NULL UNIQUE CHECK (tipo_vehiculo IN ('AUTO', 'MOTO', 'DISCAPACIDAD')),
    valor_hora        NUMERIC(8,2)  NOT NULL CHECK (valor_hora > 0),
    fraccion_minutos  INTEGER       NOT NULL CHECK (fraccion_minutos BETWEEN 5 AND 60),
    minutos_gracia    INTEGER       NOT NULL DEFAULT 0 CHECK (minutos_gracia BETWEEN 0 AND 60),
    tope_diario       NUMERIC(8,2)  NOT NULL CHECK (tope_diario > 0),
    actualizado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- REGLAS de tarifa dinámica (recargos +% / descuentos -%)
--   ALTA_DEMANDA      : umbral = % de ocupación al ingresar
--   HORA_PICO         : hora_inicio - hora_fin
--   NOCTURNA          : hora_inicio - hora_fin (puede cruzar medianoche)
--   CLIENTE_FRECUENTE : umbral = número de visitas previas
-- ---------------------------------------------------------------------
CREATE TABLE reglas_tarifa (
    id           SERIAL PRIMARY KEY,
    codigo       VARCHAR(30)  NOT NULL UNIQUE
                 CHECK (codigo IN ('ALTA_DEMANDA', 'HORA_PICO', 'NOCTURNA', 'CLIENTE_FRECUENTE')),
    nombre       VARCHAR(80)  NOT NULL,
    activa       BOOLEAN      NOT NULL DEFAULT TRUE,
    porcentaje   NUMERIC(5,2) NOT NULL CHECK (porcentaje BETWEEN -90 AND 200),
    umbral       NUMERIC(6,2),
    hora_inicio  TIME,
    hora_fin     TIME,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- SESIONES de estacionamiento (ticket)
-- ---------------------------------------------------------------------
CREATE TABLE sesiones (
    id                  SERIAL PRIMARY KEY,
    codigo_ticket       VARCHAR(20)  NOT NULL UNIQUE,
    vehiculo_id         INTEGER      NOT NULL REFERENCES vehiculos(id),
    espacio_id          INTEGER      NOT NULL REFERENCES espacios(id),
    usuario_entrada_id  INTEGER      NOT NULL REFERENCES usuarios(id),
    usuario_salida_id   INTEGER      REFERENCES usuarios(id),
    fecha_entrada       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_salida        TIMESTAMPTZ,
    estado              VARCHAR(10)  NOT NULL DEFAULT 'ABIERTA'
                        CHECK (estado IN ('ABIERTA', 'CERRADA', 'ANULADA')),
    ocupacion_entrada   NUMERIC(5,2) NOT NULL DEFAULT 0,   -- % de ocupación al ingresar (tarifa dinámica)
    metodo_registro     VARCHAR(10)  NOT NULL DEFAULT 'MANUAL' CHECK (metodo_registro IN ('LPR', 'MANUAL')),
    confianza_lectura   NUMERIC(5,2),
    detalle_calculo     JSONB,
    total               NUMERIC(10,2),
    motivo_anulacion    VARCHAR(200),
    CONSTRAINT chk_salida_posterior CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_entrada)
);
-- Regla de negocio a nivel de BD (control de concurrencia):
--  * un vehículo no puede tener dos sesiones abiertas
--  * un espacio no puede tener dos sesiones abiertas
CREATE UNIQUE INDEX uq_sesion_abierta_vehiculo ON sesiones(vehiculo_id) WHERE estado = 'ABIERTA';
CREATE UNIQUE INDEX uq_sesion_abierta_espacio  ON sesiones(espacio_id)  WHERE estado = 'ABIERTA';
CREATE INDEX idx_sesiones_fechas ON sesiones(fecha_entrada, estado);

-- ---------------------------------------------------------------------
-- PAGOS (un solo pago por sesión -> evita cobros duplicados)
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
    id          SERIAL PRIMARY KEY,
    sesion_id   INTEGER       NOT NULL UNIQUE REFERENCES sesiones(id),
    monto       NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    metodo      VARCHAR(15)   NOT NULL CHECK (metodo IN ('EFECTIVO', 'TRANSFERENCIA')),
    referencia  VARCHAR(60),
    usuario_id  INTEGER       NOT NULL REFERENCES usuarios(id),
    fecha       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pagos_fecha ON pagos(fecha);

-- ---------------------------------------------------------------------
-- AUDITORÍA de operaciones importantes
-- ---------------------------------------------------------------------
CREATE TABLE auditoria (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      INTEGER      REFERENCES usuarios(id),
    usuario_nombre  VARCHAR(100),
    rol             VARCHAR(10),
    accion          VARCHAR(40)  NOT NULL,
    entidad         VARCHAR(30)  NOT NULL,
    registro_id     VARCHAR(40),
    detalle         JSONB,
    ip              VARCHAR(45),
    fecha           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha DESC);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);
