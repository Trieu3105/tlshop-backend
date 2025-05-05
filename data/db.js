// data/db.js
const mysql = require('mysql2/promise');

// Tạo connection pool thay vì single connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tlshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Không cần gọi db.connect() nữa
module.exports = db;