// Validaciones del lado del servidor. Nunca confiamos en lo que envía el cliente.
const HttpError = require('./httpError');

const MAX_INT_PG = 2147483647;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esCorreoValido(valor) {
  return typeof valor === 'string' && valor.length <= 255 && REGEX_CORREO.test(valor.trim());
}

// Convierte un identificador (de la URL o del cuerpo) en entero positivo, o devuelve null.
function aId(valor) {
  const texto = typeof valor === 'number' ? String(valor) : valor;
  if (typeof texto !== 'string' || !/^\d+$/.test(texto)) return null;
  const id = Number(texto);
  return id >= 1 && id <= MAX_INT_PG ? id : null;
}

// Valida :id de la ruta. Un id mal formado es una petición mal formada -> 400.
function idDeRuta(valor, nombre = 'id') {
  const id = aId(valor);
  if (id === null) {
    throw new HttpError(400, 'ID_INVALIDO', `El parámetro ${nombre} debe ser un entero positivo.`);
  }
  return id;
}

// Errores de contenido en el cuerpo (campos vacíos, precio inválido...) -> 422.
function lanzarSiHayErrores(errores) {
  if (errores.length > 0) {
    throw new HttpError(422, 'VALIDACION', 'Los datos enviados no son válidos.', errores);
  }
}

function validarRegistro(body) {
  const errores = [];
  if (!esTextoNoVacio(body.nombre)) errores.push({ campo: 'nombre', mensaje: 'Es obligatorio.' });
  else if (body.nombre.trim().length > 100) errores.push({ campo: 'nombre', mensaje: 'Máximo 100 caracteres.' });
  if (!esCorreoValido(body.correo)) errores.push({ campo: 'correo', mensaje: 'Debe ser un correo válido.' });
  if (typeof body.password !== 'string' || body.password.length < 8) {
    errores.push({ campo: 'password', mensaje: 'Debe tener al menos 8 caracteres.' });
  } else if (body.password.length > 72) {
    errores.push({ campo: 'password', mensaje: 'Máximo 72 caracteres.' });
  }
  lanzarSiHayErrores(errores);
  return {
    nombre: body.nombre.trim(),
    correo: body.correo.trim().toLowerCase(),
    password: body.password,
  };
}

function validarLogin(body) {
  const errores = [];
  if (!esTextoNoVacio(body.correo)) errores.push({ campo: 'correo', mensaje: 'Es obligatorio.' });
  if (!esTextoNoVacio(body.password)) errores.push({ campo: 'password', mensaje: 'Es obligatorio.' });
  lanzarSiHayErrores(errores);
  return { correo: body.correo.trim().toLowerCase(), password: body.password };
}

// Solo se aceptan estos campos; cualquier otro (id, creado_en...) se ignora.
function validarProducto(body) {
  const errores = [];
  const campos = { nombre: 120, descripcion: 1000, categoria: 60 };
  for (const [campo, max] of Object.entries(campos)) {
    if (!esTextoNoVacio(body[campo])) errores.push({ campo, mensaje: 'Es obligatorio.' });
    else if (body[campo].trim().length > max) errores.push({ campo, mensaje: `Máximo ${max} caracteres.` });
  }

  const precio = body.precio;
  if (typeof precio !== 'number' || !Number.isFinite(precio)) {
    errores.push({ campo: 'precio', mensaje: 'Es obligatorio y debe ser un número.' });
  } else if (precio <= 0) {
    errores.push({ campo: 'precio', mensaje: 'Debe ser mayor que cero.' });
  } else if (precio > 99999999.99) {
    errores.push({ campo: 'precio', mensaje: 'Debe ser menor que 100.000.000.' });
  } else if (Math.round(precio * 100) / 100 !== precio) {
    errores.push({ campo: 'precio', mensaje: 'Máximo dos decimales.' });
  }

  lanzarSiHayErrores(errores);
  return {
    nombre: body.nombre.trim(),
    descripcion: body.descripcion.trim(),
    categoria: body.categoria.trim().toLowerCase(),
    precio,
  };
}

function validarFavorito(body) {
  const productoId = aId(body.productoId);
  if (productoId === null) {
    lanzarSiHayErrores([{ campo: 'productoId', mensaje: 'Es obligatorio y debe ser un entero positivo.' }]);
  }
  return { productoId };
}

module.exports = {
  esCorreoValido,
  idDeRuta,
  validarRegistro,
  validarLogin,
  validarProducto,
  validarFavorito,
};
