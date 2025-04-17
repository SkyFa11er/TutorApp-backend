const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  sendMessage,
  getChatMessages,
  getConversationList
} = require('../controllers/messageController');

// ✅ 傳送訊息（語意清楚：/send）
router.post('/send', auth, sendMessage);

// ✅ 查詢與某人所有對話紀錄
router.get('/chat/:userId', auth, getChatMessages);

// ✅ 查詢聊天室列表（每位對象的最後一筆訊息）
router.get('/conversations', auth, getConversationList);

module.exports = router;
