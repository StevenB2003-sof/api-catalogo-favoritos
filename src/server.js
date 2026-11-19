// Punto de entrada: comprueba la conexión a la BD y levanta el servidor HTTP.
const { puerto } = require('./config/env');
const pool = require('./db/pool');
const app = require('./app');

async function iniciar() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('No se pudo conectar a PostgreSQL. Revisa DATABASE_URL y que el servicio esté encendido.');
    console.error(err.message);
    process.exit(1);
  }

  const servidor = app.listen(puerto, () => {
    console.log(`API del catálogo escuchando en http://localhost:${puerto}/api`);
  });

  const apagar = () => {
    servidor.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

iniciar();
