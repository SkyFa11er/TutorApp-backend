const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');

const {
  createMatch,
  checkMatch,
  getMyMatches,
  rejectMatch,
  acceptMatch,
  closeMatch
} = require('../controllers/matchController');

// 查詢我的配對紀錄
router.get('/my', auth, getMyMatches);

// 申請配對
router.post('/', auth, createMatch);

// 判斷是否配對
router.get('/check/:userId', auth, checkMatch);

// 拒絕配對
router.put('/:id/reject', auth, rejectMatch);

// 接受配對
router.put('/:id/accept', auth, acceptMatch);

// 結束配對
router.put('/:id/close', auth, closeMatch);

module.exports = router;
