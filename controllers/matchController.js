const db = require('../models/db');

// 申請配對
const createMatch = async (req, res) => {
  const from_user = req.user.id;
  const to_user = req.body.to_user;

  if (!to_user || from_user === to_user) {
    return res.status(400).json({ message: '無效的對象 ID' });
  }

  try {
    // 只阻止 status 為 pending 或 active 的配對（歷史可重配）
    const [fromMatched] = await db.query(`
      SELECT * FROM matches 
      WHERE (from_user = ? OR to_user = ?) AND status IN ('pending', 'active')`,
      [from_user, from_user]);

    if (fromMatched.length > 0) {
      return res.status(409).json({ message: '你已經配對過其他人' });
    }

    const [toMatched] = await db.query(`
      SELECT * FROM matches 
      WHERE (from_user = ? OR to_user = ?) AND status IN ('pending', 'active')`,
      [to_user, to_user]);

    if (toMatched.length > 0) {
      return res.status(409).json({ message: '對方已與其他人配對' });
    }

    await db.query(`
      INSERT INTO matches (from_user, to_user, status, created_at)
      VALUES (?, ?, 'pending', NOW())`,
      [from_user, to_user]);

    res.json({ message: '✅ 配對已送出' });

  } catch (error) {
    console.error('配對錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 查詢與某人的配對狀態
const checkMatch = async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = parseInt(req.params.userId);

  try {
    const [rows] = await db.query(`
      SELECT * FROM matches 
      WHERE 
        ((from_user = ? AND to_user = ?) 
         OR (from_user = ? AND to_user = ?)) 
        AND status IN ('pending', 'active')`,
      [currentUserId, otherUserId, otherUserId, currentUserId]);

    res.json({ matched: rows.length > 0 });
  } catch (error) {
    console.error('查詢配對錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 查詢我的所有配對

const getMyMatches = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        m.id AS match_id,
        CASE 
          WHEN m.from_user = ? THEN m.to_user
          ELSE m.from_user
        END AS user_id,
        u.name,
        u.role,
        u.phone,
        m.status,
        m.created_at,
        m.ended_at
      FROM matches m
      JOIN users u ON u.id = CASE 
          WHEN m.from_user = ? THEN m.to_user
          ELSE m.from_user
      END
      WHERE m.from_user = ? OR m.to_user = ?
      ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId]);

    // 針對家長補抓 find_tutors 的 district 和 address
    const enrichedRows = await Promise.all(rows.map(async (match) => {
      if (match.role === 'parent') {
        const [findRows] = await db.query(`
          SELECT district, address FROM find_tutors 
          WHERE user_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `, [match.user_id]);

        match.district = findRows[0]?.district || '未提供';
        match.address = findRows[0]?.address || '未提供';
      }
      return match;
    }));

    res.json({ message: '✅ 查詢成功', data: enrichedRows });
  } catch (error) {
    console.error('查詢配對紀錄錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};


// 拒絕配對
const rejectMatch = async (req, res) => {
  const matchId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const [rows] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    const match = rows[0];

    if (!match) {
      return res.status(404).json({ message: '❌ 配對不存在' });
    }

    if (match.to_user !== userId) {
      return res.status(403).json({ message: '⚠️ 僅被配對者可以拒絕' });
    }

    await db.query(`
      UPDATE matches 
      SET status = 'rejected', ended_at = NOW()
      WHERE id = ?`, [matchId]);

    res.json({ message: '❌ 配對已拒絕' });

  } catch (error) {
    console.error('拒絕配對錯誤：', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 接受配對
const acceptMatch = async (req, res) => {
    const matchId = parseInt(req.params.id);
    const userId = req.user.id;
  
    try {
      const [rows] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
      const match = rows[0];
  
      if (!match) {
        return res.status(404).json({ message: '❌ 配對不存在' });
      }
  
      if (match.to_user !== userId) {
        return res.status(403).json({ message: '⚠️ 僅被配對者可以接受配對' });
      }
  
      if (match.status !== 'pending') {
        return res.status(400).json({ message: '⚠️ 此配對已非等待狀態' });
      }
  
      await db.query(`
        UPDATE matches 
        SET status = 'active'
        WHERE id = ?`, [matchId]);
  
      // ✅ 補上配對成功後更新 is_matched
      let targetUserId = match.from_user;
      const [targetUserRows] = await db.query('SELECT role FROM users WHERE id = ?', [targetUserId]);
      const targetRole = targetUserRows[0]?.role;
  
      if (targetRole === 'student') {
        await db.query('UPDATE tutors SET is_matched = true WHERE user_id = ?', [targetUserId]);
      } else if (targetRole === 'parent') {
        await db.query('UPDATE find_tutors SET is_matched = true WHERE user_id = ?', [targetUserId]);
      }
  
      res.json({ message: '✅ 配對已成功接受' });
  
    } catch (error) {
      console.error('接受配對錯誤：', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
};

// 結束配對
const closeMatch = async (req, res) => {
    const matchId = parseInt(req.params.id);
    const userId = req.user.id;
  
    try {
      const [rows] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
      const match = rows[0];
  
      if (!match) {
        return res.status(404).json({ message: '❌ 配對不存在' });
      }
  
      const isParticipant = match.from_user === userId || match.to_user === userId;
      if (!isParticipant) {
        return res.status(403).json({ message: '⚠️ 僅配對雙方可結束配對' });
      }
  
      if (match.status !== 'active') {
        return res.status(400).json({ message: '⚠️ 僅進行中的配對可關閉' });
      }
  
      await db.query(`
        UPDATE matches 
        SET status = 'closed', ended_at = NOW()
        WHERE id = ?`, [matchId]);
  
      res.json({ message: '✅ 配對已成功結束' });
  
    } catch (error) {
      console.error('結束配對錯誤：', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
};
  

module.exports = {
  createMatch,
  checkMatch,
  getMyMatches,
  rejectMatch,
  acceptMatch,
  closeMatch
};
