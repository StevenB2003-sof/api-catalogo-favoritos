// Acceso a datos de favoritos. TODAS las consultas filtran por usuario_id,
// que siempre viene del token verificado (nunca del cliente).
const pool = require('../db/pool');
const { aProducto } = require('./productosRepo');

async function listarDeUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT f.creado_en AS agregado_en,
            p.id, p.nombre, p.descripcion, p.categoria, p.precio, p.creado_en, p.actualizado_en
       FROM favoritos f
       JOIN productos p ON p.id = f.producto_id
      WHERE f.usuario_id = $1
      ORDER BY f.creado_en DESC, p.id`,
    [usuarioId]
  );
  return rows.map((fila) => ({ agregadoEn: fila.agregado_en, producto: aProducto(fila) }));
}

// Devuelve el favorito creado, o lanza el error de PostgreSQL:
//   23505 = ya existe (clave primaria duplicada)
//   23503 = el producto no existe (llave foránea)
async function agregar(usuarioId, productoId) {
  const { rows } = await pool.query(
    `INSERT INTO favoritos (usuario_id, producto_id)
     VALUES ($1, $2)
     RETURNING usuario_id, producto_id, creado_en`,
    [usuarioId, productoId]
  );
  return rows[0];
}

async function quitar(usuarioId, productoId) {
  const { rowCount } = await pool.query(
    'DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
    [usuarioId, productoId]
  );
  return rowCount > 0;
}

module.exports = { listarDeUsuario, agregar, quitar };
