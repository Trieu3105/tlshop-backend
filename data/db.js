const mysql = require("mysql2/promise");

// Kiểm tra môi trường (development hoặc production)
const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: isProduction ? process.env.PROD_DB_HOST : process.env.DB_HOST,
  user: isProduction ? process.env.PROD_DB_USER : process.env.DB_USER,
  password: isProduction ? process.env.PROD_DB_PASSWORD : process.env.DB_PASSWORD,
  database: isProduction ? process.env.PROD_DB_NAME : process.env.DB_NAME,
  port: isProduction ? process.env.PROD_DB_PORT : process.env.DB_PORT,
});

pool.getConnection()
  .then(() => console.log("Database connected successfully."))
  .catch(err => console.error("Database connection failed:", err));

module.exports = pool;
