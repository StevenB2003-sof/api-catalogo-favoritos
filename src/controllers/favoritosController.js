// Favoritos del usuario autenticado. El usuario SIEMPRE sale de req.usuario
// (puesto por verificarToken a partir del JWT). Si el cliente envía un
// usuarioId en el cuerpo o la URL, se ignora.
const favoritosRepo = require('../repositories/favoritosRepo');
const { idDeRuta, validarFavorito } = require('../utils/validaciones');
const HttpError = require('../utils/httpError');

// GET /api/favoritos
async function listar(req, res) {
  const favoritos = await favoritosRepo.listarDeUsuario(req.usuario.id);
  res.status(200).json({ data: favoritos, total: favoritos.length });
}

// POST /api/favoritos   { "productoId": 3 }
async function agregar(req, res) {
  const { productoId } = validarFavorito(req.body || {});
  try {
    const fila = await favoritosRepo.agregar(req.usuario.id, productoId);
    res.status(201).json({
      data: { usuarioId: fila.usuario_id, productoId: fila.producto_id, agregadoEn: fila.creado_en },
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new HttpError(409, 'FAVORITO_DUPLICADO', 'Ese producto ya está en tus favoritos.');
    }
    if (err.code === '23503') {
      throw new HttpError(404, 'PRODUCTO_NO_ENCONTRADO', `No existe un producto con id ${productoId}.`);
    }
    throw err;
  }
}

// DELETE /api/favoritos/:productoId
// Si el producto no está en los favoritos DE ESTE usuario -> 404
// (no revelamos si está en los favoritos de otra persona).
async function quitar(req, res) {
  const productoId = idDeRuta(req.params.productoId, 'productoId');
  const quitado = await favoritosRepo.quitar(req.usuario.id, productoId);
  if (!quitado) {
    throw new HttpError(404, 'FAVORITO_NO_ENCONTRADO', 'Ese producto no está en tus favoritos.');
  }
  res.status(204).end();
}

module.exports = { listar, agregar, quitar };
