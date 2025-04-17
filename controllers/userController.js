const db = require('../models/db');

// 🔐 查詢目前登入者資訊（來自 token）
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;  // 從 JWT 解出的 ID

    const [users] = await db.query(
      'SELECT id, role, name, phone, school, major, enroll_year, verified FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    res.status(200).json({ user: users[0] });
  } catch (err) {
    console.error('getMe 錯誤:', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
  getMe,
};
