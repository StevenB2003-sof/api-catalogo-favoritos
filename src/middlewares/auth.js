// Middlewares de autenticación (JWT) y autorización (rol).
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const usuariosRepo = require('../repositories/usuariosRepo');
const HttpError = require('../utils/httpError');

// 1) Lee "Authorization: Bearer <token>".
// 2) Verifica firma Y expiración con jwt.verify (rechaza alg distintos a HS256).
// 3) Carga el usuario desde la BD: así el rol siempre es el actual y un
//    usuario eliminado deja de tener acceso aunque su token no haya vencido.
async function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new HttpError(401, 'NO_AUTENTICADO', 'Falta el token. Envía la cabecera Authorization: Bearer <token>.');
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new HttpError(401, 'TOKEN_VENCIDO', 'El token ha vencido. Inicia sesión de nuevo.');
    }
    throw new HttpError(401, 'TOKEN_INVALIDO', 'El token no es válido.');
  }

  const usuario = await usuariosRepo.buscarPorId(Number(payload.sub));
  if (!usuario) {
    throw new HttpError(401, 'TOKEN_INVALIDO', 'El usuario del token ya no existe.');
  }

  req.usuario = usuario; // identidad confiable para los controladores
  next();
}

// Se usa DESPUÉS de verificarToken: requerirRol('admin')
function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      throw new HttpError(403, 'PROHIBIDO', 'No tienes permisos para realizar esta acción.');
    }
    next();
  };
}

module.exports = { verificarToken, requerirRol };
