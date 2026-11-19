// Carga y valida las variables de entorno en un solo lugar.
require('dotenv').config({ quiet: true });

const requeridas = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = requeridas.filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(', ')}. Revisa tu archivo .env (usa .env.example como guía).`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET debe tener al menos 32 caracteres.');
  process.exit(1);
}

module.exports = {
  puerto: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiraEn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRondas: Number(process.env.BCRYPT_ROUNDS) || 10,
};
