const jwt = require('jsonwebtoken');

// JWT 驗證中介層，用來保護需要登入的 API
const auth = (req, res, next) => {
  // 從請求標頭取得 Authorization 欄位
  const authHeader = req.headers.authorization;

  // 檢查是否有傳入 token，並且格式為 Bearer 開頭
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '請先登入才能操作' });
  }

  // 從 Bearer token 中取得實際的 JWT token 字串
  const token = authHeader.split(' ')[1];

  try {
    // 使用 JWT 密鑰驗證 token，預設使用 .env 中的 JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // 將解碼後的使用者資訊放進 req.user，供後續 API 使用
    req.user = decoded;

    // 可選：列印驗證成功的使用者資訊到伺服器終端機（方便除錯）
    console.log('⚠️ JWT Middleware 已進入：', req.user);

    // 通過驗證，繼續下一個中介層或 controller
    next();
  } catch (error) {
    // 驗證失敗（例如 token 過期或錯誤）
    console.error('JWT 驗證失敗:', error);
    return res.status(401).json({ message: 'Token 無效或已過期，請重新登入' });
  }
};

module.exports = auth;
