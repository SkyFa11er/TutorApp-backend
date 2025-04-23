const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const db = require('./models/db');
const expressWs = require('express-ws');
const matchRoutes = require('./routes/matchRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);             // ✅ 建立 HTTP server
expressWs(app, server);                            // ✅ 將 WebSocket 綁定到同一個 server

const PORT = process.env.PORT || 3000;

// ✅ 中介層設定
app.use(cors());
app.use(express.json());

// ✅ 掛載 REST API 路由
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tutors', require('./routes/tutorRoutes'));
app.use('/api/find-tutors', require('./routes/findTutorRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/matches', matchRoutes);

// ✅ 測試首頁
app.get('/', (req, res) => {
  res.send('Tutor App Backend 運作中 🚀');
});

// ✅ WebSocket 路由
app.ws('/ws', (ws, req) => {
  console.log('✅ WebSocket 已連線');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { from_user_id, to_user_id, content } = data;

      if (!from_user_id || !to_user_id || !content) {
        return ws.send(JSON.stringify({ error: '缺少必要欄位' }));
      }

      await db.query(
        `INSERT INTO messages (sender_id, receiver_id, content, created_at, timestamp)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [from_user_id, to_user_id, content]
      );

      console.log(`💬 [訊息] ${from_user_id} → ${to_user_id}：${content}`);
      ws.send(JSON.stringify({ success: true }));

    } catch (err) {
      console.error('❌ 處理訊息錯誤：', err);
      ws.send(JSON.stringify({ error: '伺服器錯誤' }));
    }
  });

  ws.on('close', () => {
    console.log('⚠️ WebSocket 已關閉');
  });
});

// ✅ 捕捉未知路由
app.use((req, res) => {
  res.status(404).json({ message: `找不到路由：${req.originalUrl}` });
});

// ✅ 啟動伺服器（讓外部能連）
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 伺服器啟動於 http://0.0.0.0:${PORT}`);
});
