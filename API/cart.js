const express = require("express");
const router = express.Router();
const db = require("../data/db"); // Kết nối database
router.use(express.json()); // Middleware để parse JSON body

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Cart API is healthy', 
        apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8080/api" // Use API_BASE_URL from .env
    });
});

// Thêm sản phẩm vào giỏ
router.post("/add", async (req, res) => {
    const { id_user, id_product, quantity } = req.body;

    try {
        // 1. Lấy thông tin sản phẩm từ bảng `products`
        const [product] = await db.query(
            "SELECT name, price FROM products WHERE id = ?",
            [id_product]
        );

        if (product.length === 0) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
        }

        const { name, price } = product[0];

        // 2. Kiểm tra giỏ hàng đã tồn tại chưa
        const [existingCart] = await db.query(
            "SELECT id FROM carts WHERE id_user = ? ORDER BY created_at DESC LIMIT 1",
            [id_user]
        );

        let cartId;
        if (existingCart.length > 0) {
            cartId = existingCart[0].id;
        } else {
            // Nếu chưa có giỏ hàng thì tạo mới
            const [newCart] = await db.query(
                "INSERT INTO carts (id_user) VALUES (?)",
                [id_user]
            );
            cartId = newCart.insertId;
        }

        // 3. Kiểm tra sản phẩm đã có trong giỏ chưa
        const [existingItem] = await db.query(
            "SELECT id, quantity FROM cart_items WHERE id_cart = ? AND id_product = ?",
            [cartId, id_product]
        );

        if (existingItem.length > 0) {
            // Nếu có rồi → Cập nhật số lượng
            await db.query(
                "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
                [quantity, existingItem[0].id]
            );
        } else {
            // Nếu chưa có → Thêm mới
            await db.query(
                "INSERT INTO cart_items (id_cart, id_product, quantity, price) VALUES (?, ?, ?, ?)",
                [cartId, id_product, quantity, price]
            );
        }

        console.log(
            `Sản phẩm đã được thêm vào giỏ hàng: User ${id_user}, Product ${id_product}, Quantity ${quantity}`
        );
        return res
            .status(200)
            .json({ message: "Đã thêm vào giỏ hàng thành công!" });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
        return res.status(500).json({ message: "Lỗi khi thêm vào giỏ hàng!" });
    }
});

// Lấy danh sách sản phẩm trong giỏ hàng
router.get("/carts/:id_user", async (req, res) => {
    const { id_user } = req.params;

    try {
        const [cart] = await db.query(
            `SELECT ci.id, p.name, ci.quantity, ci.price, p.images 
             FROM cart_items ci
             JOIN carts c ON ci.id_cart = c.id
             JOIN products p ON ci.id_product = p.id
             WHERE c.id_user = ?`,
            [id_user]
        );

        return res.status(200).json({ cartItems: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy giỏ hàng!" });
    }
});

// Cập nhật giỏ hàng
router.put("/update", async (req, res) => {
    const { cartItems } = req.body; // Nhận danh sách sản phẩm từ frontend

    try {
        for (const item of cartItems) {
            const { id, quantity } = item;

            // Cập nhật số lượng sản phẩm trong giỏ hàng
            await db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [
                quantity,
                id,
            ]);
        }

        return res.status(200).json({ message: "Giỏ hàng đã được cập nhật!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi cập nhật giỏ hàng!" });
    }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete("/remove", async (req, res) => {
    const { id_cart_item } = req.body;

    try {
        await db.query("DELETE FROM cart_items WHERE id = ?", [id_cart_item]);
        return res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi xóa sản phẩm!" });
    }
});

module.exports = router;
