const express = require("express");
const router = express.Router();
const db = require("../data/db"); // Kết nối database
router.use(express.json()); // Middleware để parse JSON body

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Payment API is healthy', 
        apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8080/api" // Use API_BASE_URL from .env
    });
});

// Endpoint thanh toán
router.post("/checkout", async (req, res) => {
  const { id_user, payment_method } = req.body; // Nhận id_user và phương thức thanh toán từ frontend

  try {
    // 1. Lấy giỏ hàng của người dùng
    const [cartItems] = await db.query(
      `SELECT ci.id AS cart_item_id, ci.id_product, ci.quantity, ci.price, p.name 
       FROM cart_items ci
       JOIN carts c ON ci.id_cart = c.id
       JOIN products p ON ci.id_product = p.id
       WHERE c.id_user = ?`,
      [id_user]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống, không thể thanh toán!" });
    }

    // 2. Tính tổng tiền
    const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // 3. Tạo bản ghi thanh toán trong bảng `payments`
    const [paymentResult] = await db.query(
      `INSERT INTO payments (id_user, total_amount, payment_method, status) VALUES (?, ?, ?, ?)`,
      [id_user, totalAmount, payment_method, "pending"] // Trạng thái ban đầu là "pending"
    );

    const paymentId = paymentResult.insertId;

    // 4. Lưu chi tiết thanh toán vào bảng `payment_details`
    for (const item of cartItems) {
      await db.query(
        `INSERT INTO payment_details (id_payment, id_product, quantity, price) VALUES (?, ?, ?, ?)`,
        [paymentId, item.id_product, item.quantity, item.price]
      );
    }

    // 5. Xóa giỏ hàng sau khi thanh toán thành công
    await db.query(
      `DELETE ci 
       FROM cart_items ci
       JOIN carts c ON ci.id_cart = c.id
       WHERE c.id_user = ?`,
      [id_user]
    );

    // 6. Cập nhật trạng thái thanh toán thành "completed"
    await db.query(`UPDATE payments SET status = ? WHERE id = ?`, ["completed", paymentId]);

    return res.status(200).json({
      message: "Thanh toán thành công!",
      paymentId,
      totalAmount,
    });
  } catch (error) {
    console.error("Lỗi khi thực hiện thanh toán:", error);
    return res.status(500).json({ message: "Lỗi khi thực hiện thanh toán!" });
  }
});

module.exports = router;