// Configuración de Express (sin levantar el servidor, para poder reutilizarla).
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const favoritosRoutes = require('./routes/favoritos.routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errores');

const app = express();

app.disable('x-powered-by'); // no anunciar que usamos Express
app.use(express.json({ limit: '100kb' }));

app.get('/api/salud', (req, res) => res.status(200).json({ data: { estado: 'ok' } }));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/favoritos', favoritosRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
