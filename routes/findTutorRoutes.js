const express = require('express');
const router = express.Router();
const {
  postFindTutor,
  getAllFindTutors,
  getMyFindTutors,
  deleteFindTutor,
  updateFindTutor,
} = require('../controllers/findTutorController');
const auth = require('../middlewares/authMiddleware');

// ✅ 公開：廣場顯示
router.get('/', getAllFindTutors);

// ✅ 私人：查自己
router.get('/my', auth, getMyFindTutors);

// ✅ 私人：刪除自己的資料
router.delete('/:id', auth, deleteFindTutor);

// ✅ 私人：發布新資料
router.post('/', auth, postFindTutor);

// ✅ 修改招家教資訊（需登入 & 擁有權限）
router.put('/:id', auth, updateFindTutor);

module.exports = router;
