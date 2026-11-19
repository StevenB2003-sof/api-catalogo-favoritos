// Ejecuta la colección de Postman con Newman (sin abrir Postman).
//   npm run test:postman                -> carpetas 01 a 09 (el servidor debe estar encendido)
//   npm run test:postman:persistencia   -> carpeta 10, después de reiniciar el servidor
// Lee adminCorreo/adminPassword desde .env y genera un token vencido automáticamente.
// El entorno resultante se guarda en postman/entorno.local.json (ignorado por git).
require('dotenv').config({ quiet: true });
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const newman = require('newman');

const raiz = path.join(__dirname, '..');
const coleccion = path.join(raiz, 'postman', 'catalogo.postman_collection.json');
const entornoEjemplo = path.join(raiz, 'postman', 'catalogo.postman_environment.json');
const entornoLocal = path.join(raiz, 'postman', 'entorno.local.json');
const soloPersistencia = process.argv.includes('--persistencia');

if (soloPersistencia && !fs.existsSync(entornoLocal)) {
  console.error('Primero ejecuta "npm run test:postman" (crea postman/entorno.local.json).');
  process.exit(1);
}

const tokenVencido = execFileSync(process.execPath, [path.join(__dirname, 'tokenVencido.js')]).toString();

const carpetas = soloPersistencia
  ? ['10 Persistencia - después de reiniciar']
  : JSON.parse(fs.readFileSync(coleccion, 'utf8')).item.map((c) => c.name).filter((n) => !n.startsWith('10 '));

newman.run(
  {
    collection: coleccion,
    environment: soloPersistencia ? entornoLocal : entornoEjemplo,
    folder: carpetas,
    envVar: [
      { key: 'baseUrl', value: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api` },
      { key: 'adminCorreo', value: process.env.ADMIN_CORREO || '' },
      { key: 'adminPassword', value: process.env.ADMIN_PASSWORD || '' },
      { key: 'tokenVencido', value: tokenVencido },
    ],
    exportEnvironment: entornoLocal,
    reporters: ['cli'],
  },
  (err, resumen) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
    const fallos = resumen.run.failures.length;
    process.exit(fallos > 0 ? 1 : 0);
  }
);
