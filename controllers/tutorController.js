const db = require('../models/db');

// 發布做家教資訊
const createTutor = async (req, res) => {
  const user = req.user;

  if (user.role !== 'student') {
    return res.status(403).json({ message: '只有學生才能發布家教資訊' });
  }

  const {
    subjects, salary, salary_note,
    intro, available_days, start_time, end_time
  } = req.body;

  if (!subjects || !salary || !intro || !available_days || !start_time || !end_time) {
    return res.status(400).json({ message: '請填寫所有必要欄位' });
  }

  try {
    const [rows] = await db.query('SELECT name, phone FROM users WHERE id = ?', [user.id]);
    if (rows.length === 0) return res.status(404).json({ message: '找不到使用者資料' });

    const { name, phone } = rows[0];

    await db.query(
      `INSERT INTO tutors 
       (user_id, name, phone, subjects, salary, salary_note, intro, available_days, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, name, phone,
        subjects.join(','),
        salary,
        salary_note || '',
        intro,
        available_days.join(','),
        start_time,
        end_time
      ]
    );

    res.status(201).json({ message: '家教資訊發佈成功 ✅' });
  } catch (error) {
    console.error('發佈失敗：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 取得自己發佈的家教資訊
const getMyTutorPosts = async (req, res) => {
  const user = req.user;

  if (user.role !== 'student') {
    return res.status(403).json({ message: '只有學生才能查詢自己的家教資訊' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM tutors WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    res.status(200).json({ message: '查詢成功 ✅', data: rows });
  } catch (error) {
    console.error('查詢錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤，無法取得家教資訊' });
  }
};

// ✅ 刪除自己發布的家教資訊
const deleteTutorPost = async (req, res) => {
  const user = req.user;
  const tutorId = req.params.id;

  try {
    // 確認是否存在且屬於此 user
    const [rows] = await db.query(
      'SELECT * FROM tutors WHERE id = ? AND user_id = ?',
      [tutorId, user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: '無權限或找不到資料' });
    }

    await db.query('DELETE FROM tutors WHERE id = ?', [tutorId]);
    res.json({ message: '刪除成功 ✅' });

  } catch (error) {
    console.error('刪除錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤，刪除失敗' });
  }
};

// ✅ 修改家教資訊 - 支援字串或陣列格式的 subjects / available_days
const updateTutorPost = async (req, res) => {
  const user = req.user;
  const tutorId = req.params.id;

  let {
    subjects,
    salary,
    salary_note,
    intro,
    available_days,
    start_time,
    end_time
  } = req.body;

  try {
    // ✅ 如果是字串，轉成陣列
    if (typeof subjects === 'string') {
      subjects = subjects.split(',').map(s => s.trim());
    }
    if (typeof available_days === 'string') {
      available_days = available_days.split(',').map(s => s.trim());
    }

    // ✅ 驗證身份
    const [rows] = await db.query(
      'SELECT * FROM tutors WHERE id = ? AND user_id = ?',
      [tutorId, user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: '無權限修改此筆資料' });
    }

    await db.query(
      `UPDATE tutors SET 
        subjects = ?, 
        salary = ?, 
        salary_note = ?, 
        intro = ?,  
        available_days = ?, 
        start_time = ?, 
        end_time = ? 
      WHERE id = ? AND user_id = ?`,
      [
        subjects.join(','),
        salary,
        salary_note || '',
        intro,
        available_days.join(','),
        start_time,
        end_time,
        tutorId,
        user.id
      ]
    );

    res.json({ message: '修改成功 ✅' });

  } catch (error) {
    console.error('修改錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤，修改失敗' });
  }
};


// 取得所有做家教資訊（不需登入）
const getAllTutors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tutors WHERE is_matched = false ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('取得所有家教資訊錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};


//進階條件篩選
const filterTutors = async (req, res) => {
  const { type, subjects, district, minSalary } = req.query;

  if (!type || (type !== 'do' && type !== 'find')) {
    return res.status(400).json({ message: '請提供正確的查詢類型（do 或 find）' });
  }

  try {
    let sql = '';
    const params = [];

    if (type === 'do') {
      sql = 'SELECT * FROM tutors WHERE 1=1';

      if (subjects) {
        const subjectArray = subjects.split(',');
        const subjectCondition = subjectArray.map(() => `subjects LIKE ?`).join(' OR ');
        sql += ` AND (${subjectCondition})`;
        subjectArray.forEach(sub => params.push(`%${sub}%`));
      }

      if (minSalary) {
        sql += ` AND salary >= ?`;
        params.push(parseInt(minSalary));
      }

    } else if (type === 'find') {
      sql = 'SELECT * FROM find_tutors WHERE 1=1';

      if (subjects) {
        const subjectArray = subjects.split(',');
        const subjectCondition = subjectArray.map(() => `subjects LIKE ?`).join(' OR ');
        sql += ` AND (${subjectCondition})`;
        subjectArray.forEach(sub => params.push(`%${sub}%`));
      }

      if (district && district !== '不限') {
        sql += ` AND district = ?`;
        params.push(district);
      }

      if (minSalary) {
        sql += ` AND salary >= ?`;
        params.push(parseInt(minSalary));
      }
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (error) {
    console.error('進階條件篩選錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};




module.exports = {
  createTutor,
  getMyTutorPosts,
  deleteTutorPost,
  updateTutorPost,
  getAllTutors,
  filterTutors,
};
