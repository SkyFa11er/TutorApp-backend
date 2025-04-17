const express = require('express');
const router = express.Router();

// 匯入控制器
const { registerParent } = require('../controllers/parentController');
const { registerStudent } = require('../controllers/studentController');
const auth = require('../middlewares/authMiddleware');

// 測試用
router.get('/test', (req, res) => {
  res.send('✅ 測試成功：使用者路由運作中');
});

// 註冊路由
router.post('/register/parent', registerParent);
router.post('/register/student', registerStudent);

// ✅ 新增：驗證用戶資訊的保護路由
router.get('/me', auth, (req, res) => {
  res.json({
    message: '✅ 取得使用者資料成功',
    user: req.user, // 這是從 auth middleware 解出來的資料
  });
});

module.exports = router;
