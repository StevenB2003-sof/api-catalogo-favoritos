// Error con código HTTP. Los controladores lo lanzan y el manejador de errores
// lo convierte en una respuesta JSON consistente.
class HttpError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

module.exports = HttpError;
