// Genera un JWT con firma válida pero YA VENCIDO, para probar el rechazo 401 en Postman.
// Uso: npm run -s token:vencido   -> copia el resultado en la variable tokenVencido del entorno.
// Solo sirve en desarrollo: usa el JWT_SECRET de tu .env local.
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../src/config/env');

const haceDosHoras = Math.floor(Date.now() / 1000) - 2 * 60 * 60;
const token = jwt.sign(
  { sub: '1', rol: 'usuario', iat: haceDosHoras, exp: haceDosHoras + 60 },
  jwtSecret,
  { algorithm: 'HS256' }
);
process.stdout.write(token);
