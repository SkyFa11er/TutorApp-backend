const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// 登入路由
router.post('/login', login);

module.exports = router;
