const db = require('../models/db');
const bcrypt = require('bcrypt');

const registerParent = async (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: '請填寫所有欄位' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(409).json({ message: '該電話號碼已註冊' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (role, name, phone, password) VALUES (?, ?, ?, ?)',
      ['parent', name, phone, hashedPassword]
    );

    res.status(201).json({ message: '家長註冊成功' });
  } catch (error) {
    console.error('家長註冊錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { registerParent };
