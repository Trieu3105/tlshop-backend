const express = require("express");
const db = require("../data/db"); // Import kết nối MySQL (phiên bản Promise)
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "mysecret";

// Middleware để xử lý cookie
router.use(cookieParser());
router.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Use FRONTEND_URL from .env
    credentials: true, // Allow sending cookies from frontend
  })
);

// API Login (Promise-based)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  try {
    const [results] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    if (user.password === password) {
      const token = jwt.sign({ username: user.username }, SECRET_KEY, {
        expiresIn: "1h",
      });

      res.cookie("access_token", token, { httpOnly: true, maxAge: 3600000 });
      return res.status(200).json({ message: "Login successful", token });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API Profile
router.get("/profile", async (req, res) => {
  const token =
    req.cookies?.access_token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc không tồn tại" });
  }

  if (!/^Bearer\s/.test(req.headers["authorization"])) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const username = decoded.username;

    const [results] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const user = results[0];
    return res.status(200).json({ message: "Lấy thông tin thành công", profile: user });
  } catch (err) {
    console.error("Token không hợp lệ:", err);
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
});

// API Logout
router.post("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.json({ message: "Đăng xuất thành công!" });
});

module.exports = router;
