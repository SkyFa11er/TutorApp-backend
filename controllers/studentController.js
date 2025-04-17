const db = require('../models/db');
const bcrypt = require('bcrypt');

const registerStudent = async (req, res) => {
  const { name, phone, password, school, major, enroll_year } = req.body;

  if (!name || !phone || !password || !school || !major || !enroll_year) {
    return res.status(400).json({ message: '請填寫所有欄位' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(409).json({ message: '該電話號碼已註冊' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (role, name, phone, password, school, major, enroll_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['student', name, phone, hashedPassword, school, major, enroll_year]
    );

    res.status(201).json({ message: '學生註冊成功' });
  } catch (error) {
    console.error('學生註冊錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { registerStudent };
