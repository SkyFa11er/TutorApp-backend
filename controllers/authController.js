const db = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: '請輸入電話與密碼' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);

    if (users.length === 0) {
      return res.status(404).json({ message: '帳號不存在' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    // 建立 token（可以根據需要加入其他欄位）
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || 'your_jwt_secret', // 建議存在 .env 中
      { expiresIn: '7d' }
    );

    // 回傳 token 和使用者資訊（不含密碼）
    res.status(200).json({
      message: '登入成功',
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone,
        school: user.school,
        major: user.major,
        enroll_year: user.enroll_year,
        verified: user.verified
      }
    });

  } catch (err) {
    console.error('登入失敗:', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { login };
