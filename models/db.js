const mysql = require('mysql2');
const dotenv = require('dotenv');

// 載入 .env 檔案中的設定
dotenv.config();

// 建立 MySQL 連線池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 匯出 promise 版的連線（可使用 async/await）
const db = pool.promise();

module.exports = db;
