// Crea (o actualiza) el usuario administrador a partir de variables de entorno.
// Es la ÚNICA forma de obtener el rol admin: el registro público siempre crea 'usuario'.
// Uso: definir ADMIN_NOMBRE, ADMIN_CORREO y ADMIN_PASSWORD en .env y ejecutar
//      npm run crear-admin
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');
const { bcryptRondas } = require('../src/config/env');
const { esCorreoValido } = require('../src/utils/validaciones');

async function main() {
  const nombre = (process.env.ADMIN_NOMBRE || 'Administrador').trim();
  const correo = (process.env.ADMIN_CORREO || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!esCorreoValido(correo)) throw new Error('ADMIN_CORREO falta o no es un correo válido.');
  if (password.length < 8) throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');

  const hash = await bcrypt.hash(password, bcryptRondas);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (correo) DO UPDATE
       SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash, rol = 'admin'
     RETURNING id, correo, rol`,
    [nombre, correo, hash]
  );
  console.log(`Administrador listo: id=${rows[0].id} correo=${rows[0].correo} rol=${rows[0].rol}`);
}

main()
  .catch((err) => {
    console.error('No se pudo crear el administrador:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
