const { Router } = require('express');
const favoritosController = require('../controllers/favoritosController');
const { verificarToken } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken); // todas las rutas de favoritos requieren sesión

router.get('/', favoritosController.listar);
router.post('/', favoritosController.agregar);
router.delete('/:productoId', favoritosController.quitar);

module.exports = router;
