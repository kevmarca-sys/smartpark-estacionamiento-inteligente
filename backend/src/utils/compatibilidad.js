/**
 * Regla de negocio: qué tipo de espacio puede usar cada tipo de vehículo.
 * - AUTO          -> solo espacios AUTO (no puede usar espacios para discapacidad)
 * - MOTO          -> solo espacios MOTO
 * - DISCAPACIDAD  -> primero espacios DISCAPACIDAD; si no hay, espacios AUTO
 */
const COMPATIBILIDAD = {
  AUTO: ['AUTO'],
  MOTO: ['MOTO'],
  DISCAPACIDAD: ['DISCAPACIDAD', 'AUTO'],
};

function tiposEspacioPermitidos(tipoVehiculo) {
  return COMPATIBILIDAD[tipoVehiculo] || [];
}

function esCompatible(tipoVehiculo, tipoEspacio) {
  return tiposEspacioPermitidos(tipoVehiculo).includes(tipoEspacio);
}

module.exports = { tiposEspacioPermitidos, esCompatible };
