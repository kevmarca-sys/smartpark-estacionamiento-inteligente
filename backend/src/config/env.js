require('dotenv').config();

function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el archivo .env`);
  }
  return valor;
}

const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: requerida('DATABASE_URL'),
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret: requerida('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  tzNegocio: process.env.TZ_NEGOCIO || 'America/Guayaquil',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  plateRecognizer: {
    token: process.env.PLATE_RECOGNIZER_TOKEN,
    regions: process.env.PLATE_RECOGNIZER_REGIONS,
  },
};

module.exports = env;
