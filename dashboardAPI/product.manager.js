const express = require("express");
const router = express.Router();
const db = require("../data/db"); // Kết nối mysql2/promise

// API lấy danh sách sản phẩm
router.get("/products", async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.*, 
        b.name AS brand_name, 
        c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON p.id_brand = b.id
      LEFT JOIN categories c ON p.id_category = c.id
    `);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Error fetching products" });
  }
});

// API tạo sản phẩm mới
router.post("/products", async (req, res) => {
  try {
    const {
      name,
      id_category,
      id_brand,
      price,
      discount,
      stock,
      warranty,
      description,
      specifications,
      images,
    } = req.body;

    // Validate required fields
    if (!name || !id_category || !id_brand || !price || !stock) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if the category exists
    const [categoryExists] = await db.query("SELECT id FROM categories WHERE id = ?", [id_category]);
    if (categoryExists.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    // Check if the brand exists
    const [brandExists] = await db.query("SELECT id FROM brands WHERE id = ?", [id_brand]);
    if (brandExists.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid brand ID" });
    }

    const parsedImages = images
      ? JSON.stringify(images.split(",").map((url) => url.trim()))
      : JSON.stringify([]);

    const [result] = await db.query(
      `
      INSERT INTO products 
      (name, id_category, id_brand, price, discount, stock, warranty, description, specifications, images) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        id_category,
        id_brand,
        price,
        discount || 0,
        stock,
        warranty || "",
        description || "",
        JSON.stringify(specifications || {}),
        parsedImages,
      ]
    );

    res.json({ success: true, message: "Product created successfully", id: result.insertId });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Error creating product" });
  }
});

// API cập nhật sản phẩm
router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_category, id_brand, ...updates } = req.body;

    // Validate category ID
    if (id_category) {
      const [categoryExists] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [id_category]
      );
      if (categoryExists.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid category ID" });
      }
    }

    // Validate brand ID
    if (id_brand) {
      const [brandExists] = await db.query(
        "SELECT id FROM brands WHERE id = ?",
        [id_brand]
      );
      if (brandExists.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid brand ID" });
      }
    }

    // Update product
    const parsedImages = Array.isArray(updates.images)
      ? JSON.stringify(updates.images)
      : JSON.stringify([]);
    const updatedProduct = {
      ...updates,
      id_category,
      id_brand,
      images: parsedImages,
    };

    await db.query(
      `
      UPDATE products 
      SET name = ?, id_category = ?, id_brand = ?, price = ?, discount = ?, stock = ?, warranty = ?, 
          description = ?, specifications = ?, images = ? 
      WHERE id = ?
    `,
      [
        updatedProduct.name,
        updatedProduct.id_category,
        updatedProduct.id_brand,
        updatedProduct.price,
        updatedProduct.discount,
        updatedProduct.stock,
        updatedProduct.warranty,
        updatedProduct.description,
        JSON.stringify(updatedProduct.specifications),
        updatedProduct.images,
        id,
      ]
    );

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Error updating product" });
  }
});

// API xóa sản phẩm
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM products WHERE id = ?", [id]);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Error deleting product" });
  }
});

// API lấy danh sách thương hiệu
router.get("/brands", async (req, res) => {
  try {
    const [brands] = await db.query("SELECT * FROM brands");
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ success: false, message: "Error fetching brands" });
  }
});

// API tạo thương hiệu mới
router.post("/brands", async (req, res) => {
  try {
    const { name, logo, origin } = req.body;

    const [result] = await db.query(
      "INSERT INTO brands (name, logo, origin) VALUES (?, ?, ?)",
      [name, logo, origin]
    );

    res.json({ success: true, message: "Brand created successfully", id: result.insertId });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ success: false, message: "Error creating brand" });
  }
});

// API cập nhật thương hiệu
router.put("/brands/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, origin } = req.body;

    await db.query(
      "UPDATE brands SET name = ?, logo = ?, origin = ? WHERE id = ?",
      [name, logo, origin, id]
    );

    res.json({ success: true, message: "Brand updated successfully" });
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({ success: false, message: "Error updating brand" });
  }
});

// API xóa thương hiệu
router.delete("/brands/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM brands WHERE id = ?", [id]);

    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ success: false, message: "Error deleting brand" });
  }
});

// API lấy danh sách danh mục
router.get("/categories", async (req, res) => {
  try {
    const [categories] = await db.query("SELECT * FROM categories");
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Error fetching categories" });
  }
});

// API tạo danh mục mới
router.post("/categories", async (req, res) => {
  try {
    const { name, parent_id, slug, description } = req.body;

    const [result] = await db.query(
      "INSERT INTO categories (name, parent_id, slug, description) VALUES (?, ?, ?, ?)",
      [name, parent_id, slug, description]
    );

    res.json({ success: true, message: "Category created successfully", id: result.insertId });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Error creating category" });
  }
});

// API cập nhật danh mục
router.put("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, slug, description } = req.body;

    await db.query(
      "UPDATE categories SET name = ?, parent_id = ?, slug = ?, description = ? WHERE id = ?",
      [name, parent_id, slug, description, id]
    );

    res.json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: "Error updating category" });
  }
});

// API xóa danh mục
router.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM categories WHERE id = ?", [id]);

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Error deleting category" });
  }
});

module.exports = router;
