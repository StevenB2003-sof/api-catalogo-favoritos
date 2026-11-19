// Acceso a datos de productos. Solo consultas parametrizadas.
const pool = require('../db/pool');

const COLUMNAS = 'id, nombre, descripcion, categoria, precio, creado_en, actualizado_en';

function aProducto(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    categoria: fila.categoria,
    precio: Number(fila.precio), // NUMERIC llega como texto desde pg
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

async function listar({ categoria } = {}) {
  if (categoria) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM productos WHERE lower(categoria) = lower($1) ORDER BY id`,
      [categoria]
    );
    return rows.map(aProducto);
  }
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM productos ORDER BY id`);
  return rows.map(aProducto);
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM productos WHERE id = $1`, [id]);
  return rows[0] ? aProducto(rows[0]) : null;
}

async function crear({ nombre, descripcion, categoria, precio }) {
  const { rows } = await pool.query(
    `INSERT INTO productos (nombre, descripcion, categoria, precio)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [nombre, descripcion, categoria, precio]
  );
  return aProducto(rows[0]);
}

async function actualizar(id, { nombre, descripcion, categoria, precio }) {
  const { rows } = await pool.query(
    `UPDATE productos
        SET nombre = $1, descripcion = $2, categoria = $3, precio = $4, actualizado_en = now()
      WHERE id = $5
      RETURNING ${COLUMNAS}`,
    [nombre, descripcion, categoria, precio, id]
  );
  return rows[0] ? aProducto(rows[0]) : null;
}

// Los favoritos del producto se borran solos por ON DELETE CASCADE.
async function eliminar(id) {
  const { rowCount } = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listar, buscarPorId, crear, actualizar, eliminar, aProducto };
