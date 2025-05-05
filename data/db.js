const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.MYSQL_URL, // Use MYSQL_URL from .env
  connectTimeout: 10000, // Set connection timeout to 10 seconds
});

console.log("Attempting to connect to database with URL:", process.env.MYSQL_URL);

pool.getConnection()
  .then(() => console.log("Database connected successfully."))
  .catch(err => {
    console.error("Database connection failed:", {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    process.exit(1); // Exit the process if connection fails
  });

module.exports = pool;