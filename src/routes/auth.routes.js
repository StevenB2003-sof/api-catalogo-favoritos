const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

router.post('/registro', authController.registro); // público
router.post('/login', authController.login);       // público

module.exports = router;
