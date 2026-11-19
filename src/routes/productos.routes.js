const { Router } = require('express');
const productosController = require('../controllers/productosController');
const { verificarToken, requerirRol } = require('../middlewares/auth');

const router = Router();
const soloAdmin = [verificarToken, requerirRol('admin')];

router.get('/', productosController.listar);                          // público
router.get('/:id', productosController.obtener);                      // público
router.post('/', ...soloAdmin, productosController.crear);            // admin
router.put('/:id', ...soloAdmin, productosController.actualizar);     // admin
router.delete('/:id', ...soloAdmin, productosController.eliminar);    // admin

module.exports = router;
