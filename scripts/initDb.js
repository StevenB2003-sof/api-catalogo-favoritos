// Crea las tablas (db/schema.sql) e inserta los productos de ejemplo (db/seed.sql).
// Uso: npm run db:init            -> crea lo que falte y siembra si está vacío
//      npm run db:reset           -> BORRA todo y vuelve a crear (solo desarrollo)
const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function main() {
  const reset = process.argv.includes('--reset');
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (reset) {
      await client.query('DROP TABLE IF EXISTS favoritos, productos, usuarios CASCADE');
      console.log('Tablas eliminadas (--reset).');
    }
    await client.query(schema);
    await client.query(seed);
    await client.query('COMMIT');
    const { rows } = await client.query('SELECT count(*)::int AS total FROM productos');
    console.log(`Base de datos lista. Productos en el catálogo: ${rows[0].total}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('No se pudo inicializar la base de datos:', err.message);
  process.exit(1);
});
