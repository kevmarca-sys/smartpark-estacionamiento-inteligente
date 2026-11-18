# Modelo de datos · SmartPark

```mermaid
erDiagram
    CLIENTES ||--o{ VEHICULOS : "tiene"
    VEHICULOS ||--o{ SESIONES : "registra"
    ESPACIOS ||--o{ SESIONES : "ocupa"
    USUARIOS ||--o{ SESIONES : "registra entrada / salida"
    SESIONES ||--o| PAGOS : "se paga con"
    USUARIOS ||--o{ PAGOS : "cobra"
    USUARIOS ||--o{ AUDITORIA : "genera"
    TARIFAS ||..o{ SESIONES : "se aplica según tipo"
    REGLAS_TARIFA ||..o{ SESIONES : "ajusta el cobro"

    CLIENTES {
        int id PK
        varchar nombres
        char cedula UK
        varchar correo
        varchar telefono
    }
    VEHICULOS {
        int id PK
        varchar placa UK
        varchar tipo
        int cliente_id FK
    }
    ESPACIOS {
        int id PK
        varchar codigo UK
        varchar zona
        varchar tipo
        varchar estado
        int orden_cercania
    }
    SESIONES {
        int id PK
        varchar codigo_ticket UK
        int vehiculo_id FK
        int espacio_id FK
        timestamptz fecha_entrada
        timestamptz fecha_salida
        varchar estado
        numeric ocupacion_entrada
        jsonb detalle_calculo
        numeric total
    }
    PAGOS {
        int id PK
        int sesion_id FK, UK
        numeric monto
        varchar metodo
        varchar referencia
        int usuario_id FK
    }
    TARIFAS {
        int id PK
        varchar tipo_vehiculo UK
        numeric valor_hora
        int fraccion_minutos
        int minutos_gracia
        numeric tope_diario
    }
    REGLAS_TARIFA {
        int id PK
        varchar codigo UK
        boolean activa
        numeric porcentaje
        numeric umbral
        time hora_inicio
        time hora_fin
    }
    USUARIOS {
        int id PK
        varchar usuario UK
        varchar correo UK
        varchar password_hash
        varchar rol
        boolean activo
    }
    AUDITORIA {
        bigint id PK
        int usuario_id FK
        varchar accion
        varchar entidad
        varchar registro_id
        jsonb detalle
        timestamptz fecha
    }
```

## Relaciones

| Relación | Cardinalidad | Explicación |
|---|---|---|
| Cliente → Vehículo | 1 : N | Un cliente puede tener varios vehículos. El vehículo puede no tener cliente (cliente ocasional, identificado solo por la placa). |
| Vehículo → Sesión | 1 : N | Cada visita al estacionamiento es una sesión. El historial permite detectar clientes frecuentes. |
| Espacio → Sesión | 1 : N | Un espacio tiene muchas sesiones en el tiempo, pero **solo una abierta** a la vez. |
| Sesión → Pago | 1 : 0..1 | Una sesión cerrada tiene exactamente un pago (`UNIQUE sesion_id`): evita cobros duplicados. |
| Usuario → Sesión / Pago / Auditoría | 1 : N | Queda registrado qué guardia registró la entrada, quién cobró y quién hizo cada cambio. |

## Restricciones importantes

- `uq_sesion_abierta_vehiculo`: índice **único parcial** `(vehiculo_id) WHERE estado = 'ABIERTA'`.
- `uq_sesion_abierta_espacio`: índice **único parcial** `(espacio_id) WHERE estado = 'ABIERTA'`.
- `chk_salida_posterior`: la fecha de salida no puede ser anterior a la de entrada.
- `CHECK` en los estados, los roles, los tipos de vehículo y los rangos de las tarifas.
- `ON DELETE SET NULL` en `vehiculos.cliente_id`: si se elimina un cliente, su historial se conserva.
