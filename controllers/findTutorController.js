const db = require('../models/db');

const postFindTutor = async (req, res) => {
  const { role, id: userId } = req.user;

  if (role !== 'parent') {
    return res.status(403).json({ message: '只有家長才能發布找家教資訊' });
  }

  const {
    child_name,
    phone,
    district,
    address,
    salary,
    subjects,
    days,
    note,
  } = req.body;

  if (!child_name || !phone || !district || !salary || !subjects || !days) {
    return res.status(400).json({ message: '請填寫所有必填欄位' });
  }

  try {
    await db.query(
      `INSERT INTO find_tutors
       (user_id, child_name, phone, district, address, salary, subjects, days, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, child_name, phone, district, address || '', salary, subjects, days, note || '']
    );

    res.status(201).json({ message: '✅ 找家教資訊發布成功' });
  } catch (error) {
    console.error('找家教資訊發布錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 顯示所有家長發布的找家教資訊（廣場）
const getAllFindTutors = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, child_name, salary, subjects, days, note, created_at 
       FROM find_tutors 
       ORDER BY created_at DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('取得找家教列表失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};


// 查詢自己發布的找家教資訊
const getMyFindTutors = async (req, res) => {
    const { id: userId, role } = req.user;
  
    if (role !== 'parent') {
      return res.status(403).json({ message: '只有家長可以查詢自己的發布紀錄' });
    }
  
    try {
      const [rows] = await db.query(
        `SELECT id, child_name, salary, subjects, days, note, created_at
         FROM find_tutors
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
  
      res.status(200).json(rows);
    } catch (error) {
      console.error('查詢家長發布紀錄錯誤:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
};


const deleteFindTutor = async (req, res) => {
    const { id: userId, role } = req.user;
    const findTutorId = req.params.id;
  
    if (role !== 'parent') {
      return res.status(403).json({ message: '只有家長可以刪除招家教資訊' });
    }
  
    try {
      // 先查找該筆資料是否存在且是該家長發布的
      const [rows] = await db.query(
        'SELECT id FROM find_tutors WHERE id = ? AND user_id = ?',
        [findTutorId, userId]
      );
  
      if (rows.length === 0) {
        return res.status(403).json({ message: '無權限刪除這筆資料' });
      }
  
      // 執行刪除
      await db.query('DELETE FROM find_tutors WHERE id = ?', [findTutorId]);
  
      res.status(200).json({ message: '✅ 招家教資訊已成功刪除' });
    } catch (error) {
      console.error('刪除失敗:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
};

const updateFindTutor = async (req, res) => {
    const { id: userId, role } = req.user;
    const findTutorId = req.params.id;
  
    if (role !== 'parent') {
      return res.status(403).json({ message: '只有家長可以修改招家教資訊' });
    }
  
    const {
      child_name,
      phone,
      district,
      address,
      salary,
      subjects,
      days,
      note,
    } = req.body;
  
    if (!child_name || !phone || !district || !salary || !subjects || !days) {
      return res.status(400).json({ message: '請填寫所有必填欄位' });
    }
  
    try {
      // 驗證是否為自己發布的
      const [rows] = await db.query(
        'SELECT id FROM find_tutors WHERE id = ? AND user_id = ?',
        [findTutorId, userId]
      );
  
      if (rows.length === 0) {
        return res.status(403).json({ message: '無權限修改此筆資料' });
      }
  
      // 更新資料
      await db.query(
        `UPDATE find_tutors
         SET child_name = ?, phone = ?, district = ?, address = ?, salary = ?, subjects = ?, days = ?, note = ?
         WHERE id = ?`,
        [child_name, phone, district, address || '', salary, subjects, days, note || '', findTutorId]
      );
  
      res.status(200).json({ message: '✅ 招家教資訊修改成功' });
    } catch (error) {
      console.error('修改找家教資訊失敗:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
};
  
  

module.exports = {
  getAllFindTutors,
  postFindTutor,
  getMyFindTutors,
  deleteFindTutor,
  updateFindTutor,
};
