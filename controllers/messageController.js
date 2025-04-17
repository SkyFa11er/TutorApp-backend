const db = require('../models/db');

// 傳送訊息
const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !content) {
    return res.status(400).json({ message: '請填寫完整內容' });
  }

  try {
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [sender_id, receiver_id, content]
    );
    res.status(201).json({ message: '訊息發送成功 ✅' });
  } catch (error) {
    console.error('發送訊息錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 查詢與某位用戶的對話紀錄
const getChatMessages = async (req, res) => {
  const sender_id = req.user.id;
  const receiver_id = req.params.userId;

  try {
    const [rows] = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)
       ORDER BY timestamp ASC`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    res.json({ message: '查詢成功 ✅', data: rows });
  } catch (error) {
    console.error('查詢訊息錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// ✅ 查詢每位對話對象的最後一筆訊息
const getConversationList = async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        IF(sender_id = ?, receiver_id, sender_id) AS user_id,
        MAX(created_at) AS latest_time,
        SUBSTRING_INDEX(GROUP_CONCAT(content ORDER BY created_at DESC), ',', 1) AS last_message
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY user_id
      ORDER BY latest_time DESC
    `, [currentUserId, currentUserId, currentUserId]);

    // 加入對話對象名稱
    const result = [];
    for (const row of rows) {
      const [userInfo] = await db.query('SELECT name FROM users WHERE id = ?', [row.user_id]);
      result.push({
        user_id: row.user_id,
        name: userInfo[0]?.name || '未知使用者',
        last_message: row.last_message,
        timestamp: row.latest_time,
      });
    }

    res.json({ message: '✅ 查詢成功', data: result });
  } catch (error) {
    console.error('查詢聊天室列表錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
  sendMessage,
  getChatMessages,
  getConversationList,
};
