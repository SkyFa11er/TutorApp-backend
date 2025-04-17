const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // ✅ 用來創建 http server
const { WebSocketServer } = require('ws'); // ✅ 引入 ws 套件
const db = require('./models/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 中介層設定
app.use(cors());
app.use(express.json());

// ✅ 匯入路由模組 
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const findTutorRoutes = require('./routes/findTutorRoutes');
const messageRoutes = require('./routes/messageRoutes'); // ✅ 聊天模組

// ✅ 掛載 API 路由
app.use('/api/users', userRoutes);             // 註冊、/me
app.use('/api/auth', authRoutes);              // 登入
app.use('/api/tutors', tutorRoutes);           // 做家教模組（學生身份）
app.use('/api/find-tutors', findTutorRoutes);  // 招家教模組（家長身份）
app.use('/api/messages', messageRoutes);       // 聊天模組（雙方身份）

// ✅ 測試首頁
app.get('/', (req, res) => {
  res.send('Tutor App Backend 運作中 🚀');
});

// ✅ 捕捉未知路由
app.use((req, res) => {
  res.status(404).json({ message: `找不到路由：${req.originalUrl}` });
});

// ✅ 創建 HTTP Server
const server = http.createServer(app);

// ✅ 建立 WebSocket 伺服器實例
const wss = new WebSocketServer({ server });

// ✅ 處理連線事件
wss.on('connection', (socket) => {
  console.log('✅ WebSocket 已連線');

  socket.on('message', (message) => {
    console.log('📩 收到訊息:', message.toString());

    // 範例邏輯：廣播給所有人
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === 1) {
        client.send(message.toString());
      }
    });
  });

  socket.on('close', () => {
    console.log('❌ WebSocket 連線關閉');
  });
});



// ✅ 儲存所有連線（方便之後廣播用）
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✅ WebSocket 已連線');
  clients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { from_user_id, to_user_id, content } = data;

      if (!from_user_id || !to_user_id || !content) {
        return ws.send(JSON.stringify({ error: '缺少必要欄位' }));
      }

      // ✅ 儲存訊息到資料庫
      await db.query(
        `INSERT INTO messages (sender_id, receiver_id, content, created_at, timestamp)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [from_user_id, to_user_id, content]
      );

      console.log(`💬 [訊息] ${from_user_id} → ${to_user_id}：${content}`);

      // ✅ 回傳確認（可選）
      ws.send(JSON.stringify({ success: true }));

      // ✅ 廣播給所有連線的使用者（實際可根據 to_user_id 來精準推送）
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            from_user_id,
            to_user_id,
            content,
            timestamp: new Date().toISOString()
          }));
        }
      }

    } catch (error) {
      console.error('❌ 處理訊息錯誤：', error);
      ws.send(JSON.stringify({ error: '伺服器錯誤' }));
    }
  });

  ws.on('close', () => {
    console.log('⚠️ WebSocket 已關閉');
    clients.delete(ws);
  });
});


// ✅ 啟動伺服器
server.listen(PORT, () => {
  console.log(`✅ 伺服器啟動於 http://localhost:${PORT}`);
});
