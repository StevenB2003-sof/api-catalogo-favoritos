// Registro e inicio de sesión.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiraEn, bcryptRondas } = require('../config/env');
const usuariosRepo = require('../repositories/usuariosRepo');
const { validarRegistro, validarLogin } = require('../utils/validaciones');
const HttpError = require('../utils/httpError');

// Hash fijo para comparar cuando el correo no existe: así el tiempo de respuesta
// es parecido y no se revela qué correos están registrados.
const HASH_FALSO = bcrypt.hashSync('contraseña-que-no-existe', bcryptRondas);

// POST /api/auth/registro  (público)
async function registro(req, res) {
  // Cualquier "rol" enviado por el cliente se ignora: validarRegistro no lo devuelve.
  const { nombre, correo, password } = validarRegistro(req.body || {});
  const passwordHash = await bcrypt.hash(password, bcryptRondas);

  try {
    const usuario = await usuariosRepo.crear({ nombre, correo, passwordHash });
    res.status(201).json({ data: usuario });
  } catch (err) {
    if (err.code === '23505') {
      throw new HttpError(409, 'CORREO_DUPLICADO', 'Ya existe un usuario con ese correo.');
    }
    throw err;
  }
}

// POST /api/auth/login  (público)
async function login(req, res) {
  const { correo, password } = validarLogin(req.body || {});
  const fila = await usuariosRepo.buscarPorCorreoConHash(correo);
  const coincide = await bcrypt.compare(password, fila ? fila.password_hash : HASH_FALSO);

  if (!fila || !coincide) {
    // Mismo mensaje en ambos casos para no revelar si el correo existe.
    throw new HttpError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
  }

  const token = jwt.sign({ sub: String(fila.id), rol: fila.rol }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: jwtExpiraEn,
  });

  res.status(200).json({
    data: {
      token,
      tipo: 'Bearer',
      expiraEn: jwtExpiraEn,
      usuario: usuariosRepo.aUsuarioPublico(fila), // sin password_hash
    },
  });
}

module.exports = { registro, login };
