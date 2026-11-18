-- =====================================================================
--  SmartPark - Datos de prueba (Cuenca, Ecuador)
--  Usuarios de demostración:
--     admin    / Admin123*     (ADMIN)
--     guardia  / Guardia123*   (GUARDIA)
-- =====================================================================

-- Usuarios (contraseñas con hash bcrypt)
INSERT INTO usuarios (nombre, usuario, correo, password_hash, rol) VALUES
('Kevin Marca',    'admin',    'admin@smartpark.ec',          '$2b$10$4mvcvK5Wmkp14z6ALkyU0OpbzwYh.e2ljfBedRQbEMgoHE0OJ/Rwq', 'ADMIN'),
('Juan Pacheco',   'guardia',  'guardia.juan@smartpark.ec',   '$2b$10$.7bI/zV/1A1lRchX5M/VzuHTBdk953N2cqHrL/5YBc/NTEBjf8lTy', 'GUARDIA'),
('Carlos Pérez',   'guardia2', 'guardia.carlos@smartpark.ec', '$2b$10$.7bI/zV/1A1lRchX5M/VzuHTBdk953N2cqHrL/5YBc/NTEBjf8lTy', 'GUARDIA');

-- Clientes registrados (cédulas válidas con algoritmo módulo 10)
INSERT INTO clientes (nombres, cedula, correo, telefono) VALUES
('María Guamán',   '0104567896', 'maria.guaman@correo.ec',   '0987654321'),
('José Pacheco',   '0109876540', 'jose.pacheco@correo.ec',   '0991234567'),
('Ana Quizhpi',    '0103344552', 'ana.quizhpi@correo.ec',    '0978123456'),
('Luis Sarmiento', '0112233440', 'luis.sarmiento@correo.ec', '0969988776'),
('Diego Ortiz',    '0105566772', 'diego.ortiz@correo.ec',    '0985544332');

-- Vehículos (A = Azuay, U = Cañar, P = Pichincha, G = Guayas, L = Loja)
INSERT INTO vehiculos (placa, tipo, cliente_id) VALUES
('ABA-1234', 'AUTO', 1), ('AAC-5521', 'AUTO', 2), ('ABC-1020', 'AUTO', 2),
('AAD-3310', 'DISCAPACIDAD', 3), ('ABE-0987', 'AUTO', 4), ('AC123B', 'MOTO', 5),
('PBX-3310', 'AUTO', NULL), ('GBA-0987', 'AUTO', NULL), ('ACF-4412', 'AUTO', NULL),
('AAH-7740', 'AUTO', NULL), ('UBB-2218', 'AUTO', NULL), ('LCD-9021', 'AUTO', NULL),
('ABG-6512', 'AUTO', NULL), ('AAM-3319', 'AUTO', NULL), ('ACK-1102', 'AUTO', NULL),
('ABP-4820', 'AUTO', NULL), ('AAT-1934', 'AUTO', NULL), ('ACR-7654', 'AUTO', NULL),
('ABS-9012', 'AUTO', NULL), ('AAV-6632', 'AUTO', NULL), ('AD456C', 'MOTO', NULL),
('AE789D', 'MOTO', NULL), ('ACW-3490', 'AUTO', NULL), ('ABY-8801', 'AUTO', NULL);

-- Espacios: Sección A (A1-A20) y Sección B (B1-B20)
INSERT INTO espacios (codigo, zona, tipo, orden_cercania)
SELECT 'A' || n, 'A',
       CASE WHEN n <= 2 THEN 'DISCAPACIDAD' ELSE 'AUTO' END,
       n
FROM generate_series(1, 20) AS n;

INSERT INTO espacios (codigo, zona, tipo, orden_cercania)
SELECT 'B' || n, 'B',
       CASE WHEN n >= 16 THEN 'MOTO' ELSE 'AUTO' END,
       20 + n
FROM generate_series(1, 20) AS n;

UPDATE espacios SET estado = 'INHABILITADO', motivo_inhabilitado = 'Mantenimiento de señalización'
WHERE codigo IN ('A8', 'B14');

-- Tarifas base
INSERT INTO tarifas (tipo_vehiculo, valor_hora, fraccion_minutos, minutos_gracia, tope_diario) VALUES
('AUTO',         0.50, 15, 10, 6.00),
('MOTO',         0.25, 15, 10, 3.00),
('DISCAPACIDAD', 0.30, 15, 10, 4.00);

-- Reglas de tarifa dinámica
INSERT INTO reglas_tarifa (codigo, nombre, activa, porcentaje, umbral, hora_inicio, hora_fin) VALUES
('ALTA_DEMANDA',      'Alta demanda (ocupación alta)',  TRUE,  50, 80,   NULL,    NULL),
('HORA_PICO',         'Hora pico',                      TRUE,  25, NULL, '17:00', '19:00'),
('NOCTURNA',          'Tarifa nocturna',                TRUE, -20, NULL, '22:00', '06:00'),
('CLIENTE_FRECUENTE', 'Cliente frecuente',              TRUE, -10, 10,   NULL,    NULL);

-- ---------------------------------------------------------------------
-- Historial de los últimos 14 días (sesiones cerradas con su pago)
-- para que los reportes y el panel muestren datos reales.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    d INTEGER; k INTEGER; v RECORD; e RECORD;
    entrada TIMESTAMPTZ; minutos INTEGER; total NUMERIC; tarifa NUMERIC; sid INTEGER;
    guardia INTEGER;
BEGIN
    PERFORM setseed(0.42);
    FOR d IN 1..14 LOOP
        FOR k IN 1..(18 + floor(random() * 14))::INT LOOP
            SELECT * INTO v FROM vehiculos ORDER BY random() LIMIT 1;
            SELECT * INTO e FROM espacios
             WHERE tipo = CASE WHEN v.tipo = 'MOTO' THEN 'MOTO'
                               WHEN v.tipo = 'DISCAPACIDAD' THEN 'DISCAPACIDAD' ELSE 'AUTO' END
             ORDER BY random() LIMIT 1;
            entrada := date_trunc('day', NOW() AT TIME ZONE 'America/Guayaquil') AT TIME ZONE 'America/Guayaquil'
                       - make_interval(days => d)
                       + make_interval(hours => (7 + floor(random() * 13))::INT, mins => floor(random() * 60)::INT);
            minutos := (20 + floor(random() * 220))::INT;
            SELECT valor_hora INTO tarifa FROM tarifas WHERE tipo_vehiculo = v.tipo;
            total := round(ceil(minutos / 15.0) * tarifa * 15 / 60.0, 2);
            guardia := CASE WHEN random() < 0.6 THEN 2 ELSE 3 END;

            INSERT INTO sesiones (codigo_ticket, vehiculo_id, espacio_id, usuario_entrada_id, usuario_salida_id,
                                  fecha_entrada, fecha_salida, estado, ocupacion_entrada, metodo_registro,
                                  confianza_lectura, total, detalle_calculo)
            VALUES ('TK-H' || lpad(((d * 100) + k)::TEXT, 6, '0'), v.id, e.id, guardia, guardia,
                    entrada, entrada + make_interval(mins => minutos), 'CERRADA',
                    round((40 + random() * 50)::NUMERIC, 2),
                    CASE WHEN random() < 0.85 THEN 'LPR' ELSE 'MANUAL' END,
                    round((85 + random() * 14)::NUMERIC, 2), total,
                    jsonb_build_object('minutos', minutos, 'total', total, 'historico', TRUE))
            RETURNING id INTO sid;

            INSERT INTO pagos (sesion_id, monto, metodo, usuario_id, fecha)
            VALUES (sid, total, CASE WHEN random() < 0.7 THEN 'EFECTIVO' ELSE 'TRANSFERENCIA' END,
                    guardia, entrada + make_interval(mins => minutos));
        END LOOP;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- Vehículos que están dentro en este momento (sesiones abiertas)
-- ---------------------------------------------------------------------
DO $$
DECLARE
    placas TEXT[] := ARRAY['ABA-1234','PBX-3310','GBA-0987','ACF-4412','AAH-7740','UBB-2218',
                           'LCD-9021','ABG-6512','AAM-3319','ACK-1102','AD456C'];
    espacios_ TEXT[] := ARRAY['A3','A5','A9','A10','A12','A14','A17','B2','B4','B8','B16'];
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(placas, 1) LOOP
        INSERT INTO sesiones (codigo_ticket, vehiculo_id, espacio_id, usuario_entrada_id,
                              fecha_entrada, estado, ocupacion_entrada, metodo_registro, confianza_lectura)
        SELECT 'TK-DEMO' || lpad(i::TEXT, 3, '0'), v.id, e.id, 2,
               NOW() - make_interval(mins => 15 + i * 12), 'ABIERTA', 50, 'LPR', 96.5
        FROM vehiculos v, espacios e
        WHERE v.placa = placas[i] AND e.codigo = espacios_[i];

        UPDATE espacios SET estado = 'OCUPADO' WHERE codigo = espacios_[i];
    END LOOP;
END $$;

INSERT INTO auditoria (usuario_id, usuario_nombre, rol, accion, entidad, registro_id, detalle)
VALUES (1, 'Kevin Marca', 'ADMIN', 'CARGA_INICIAL', 'sistema', NULL, '{"mensaje": "Datos de prueba cargados"}');
