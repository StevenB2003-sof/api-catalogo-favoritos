// CRUD de productos. Lectura pública; escritura solo admin (ver rutas).
const productosRepo = require('../repositories/productosRepo');
const { idDeRuta, validarProducto } = require('../utils/validaciones');
const HttpError = require('../utils/httpError');

function noEncontrado(id) {
  return new HttpError(404, 'PRODUCTO_NO_ENCONTRADO', `No existe un producto con id ${id}.`);
}

// GET /api/productos?categoria=libros
async function listar(req, res) {
  let { categoria } = req.query;
  if (categoria !== undefined) {
    if (typeof categoria !== 'string' || categoria.trim() === '') {
      throw new HttpError(400, 'FILTRO_INVALIDO', 'El filtro categoria no puede estar vacío.');
    }
    categoria = categoria.trim();
  }
  const productos = await productosRepo.listar({ categoria });
  res.status(200).json({ data: productos, total: productos.length });
}

// GET /api/productos/:id
async function obtener(req, res) {
  const id = idDeRuta(req.params.id);
  const producto = await productosRepo.buscarPorId(id);
  if (!producto) throw noEncontrado(id);
  res.status(200).json({ data: producto });
}

// POST /api/productos  (admin)
async function crear(req, res) {
  const datos = validarProducto(req.body || {});
  const producto = await productosRepo.crear(datos);
  res.status(201).location(`/api/productos/${producto.id}`).json({ data: producto });
}

// PUT /api/productos/:id  (admin) — reemplazo completo: se exigen todos los campos.
async function actualizar(req, res) {
  const id = idDeRuta(req.params.id);
  const datos = validarProducto(req.body || {});
  const producto = await productosRepo.actualizar(id, datos);
  if (!producto) throw noEncontrado(id);
  res.status(200).json({ data: producto });
}

// DELETE /api/productos/:id  (admin) — sus favoritos se eliminan en cascada.
async function eliminar(req, res) {
  const id = idDeRuta(req.params.id);
  const eliminado = await productosRepo.eliminar(id);
  if (!eliminado) throw noEncontrado(id);
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
