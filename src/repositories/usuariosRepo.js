// Acceso a datos de usuarios. Solo consultas parametrizadas ($1, $2...).
const pool = require('../db/pool');

// Convierte una fila en un objeto público: NUNCA incluye password_hash.
function aUsuarioPublico(fila) {
  return { id: fila.id, nombre: fila.nombre, correo: fila.correo, rol: fila.rol, creadoEn: fila.creado_en };
}

async function crear({ nombre, correo, passwordHash }) {
  // El rol se fija aquí en 'usuario': el cliente no puede elegirlo.
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, 'usuario')
     RETURNING id, nombre, correo, rol, creado_en`,
    [nombre, correo, passwordHash]
  );
  return aUsuarioPublico(rows[0]);
}

// Única función que devuelve el hash: solo la usa el login para comparar.
async function buscarPorCorreoConHash(correo) {
  const { rows } = await pool.query(
    'SELECT id, nombre, correo, rol, creado_en, password_hash FROM usuarios WHERE correo = $1',
    [correo]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    'SELECT id, nombre, correo, rol, creado_en FROM usuarios WHERE id = $1',
    [id]
  );
  return rows[0] ? aUsuarioPublico(rows[0]) : null;
}

module.exports = { crear, buscarPorCorreoConHash, buscarPorId, aUsuarioPublico };
