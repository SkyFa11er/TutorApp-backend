const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { WebSocketServer } = require('ws');
const db = require('./models/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 中介層設定
app.use(cors());
app.use(express.json());

// ✅ 匯入 API 路由模組
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const findTutorRoutes = require('./routes/findTutorRoutes');
const messageRoutes = require('./routes/messageRoutes');

// ✅ 掛載 API 路由
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/find-tutors', findTutorRoutes);
app.use('/api/messages', messageRoutes);

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

// ✅ 儲存所有連線
const clients = new Set();

// ✅ WebSocket 連線處理
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

      await db.query(
        `INSERT INTO messages (sender_id, receiver_id, content, created_at, timestamp)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [from_user_id, to_user_id, content]
      );

      console.log(`💬 [訊息] ${from_user_id} → ${to_user_id}：${content}`);

      ws.send(JSON.stringify({ success: true }));

      for (const client of clients) {
        if (client !== ws && client.readyState === ws.OPEN) {
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 伺服器啟動於 http://0.0.0.0:${PORT}`);
});
