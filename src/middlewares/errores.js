// Manejo centralizado de errores: todas las respuestas de error tienen la forma
// { "error": { "codigo": "...", "mensaje": "...", "detalles": [...] } }
// y nunca exponen trazas, SQL ni secretos.
const HttpError = require('../utils/httpError');

function rutaNoEncontrada(req, res, next) {
  next(new HttpError(404, 'RUTA_NO_ENCONTRADA', `No existe la ruta ${req.method} ${req.originalUrl}.`));
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  // JSON mal formado en el cuerpo -> 400
  if (err.type === 'entity.parse.failed') {
    err = new HttpError(400, 'JSON_INVALIDO', 'El cuerpo de la petición no es un JSON válido.');
  } else if (err.type === 'entity.too.large') {
    err = new HttpError(413, 'CUERPO_DEMASIADO_GRANDE', 'El cuerpo de la petición es demasiado grande.');
  }

  if (!(err instanceof HttpError)) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err);
    err = new HttpError(500, 'ERROR_INTERNO', 'Ocurrió un error interno. Intenta de nuevo más tarde.');
  }

  const cuerpo = { error: { codigo: err.codigo, mensaje: err.message } };
  if (err.detalles) cuerpo.error.detalles = err.detalles;
  res.status(err.status).json(cuerpo);
}

module.exports = { rutaNoEncontrada, manejadorErrores };
