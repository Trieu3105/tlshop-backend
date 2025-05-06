const express = require("express");
const router = express.Router();
const db = require("../data/db"); // Kết nối mysql2/promise

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Products API is healthy', 
        apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8080/api" // Use API_BASE_URL from .env
    });
});

// Biến lưu trữ danh sách sản phẩm đã được định dạng
let cachedProducts = [];

// API lấy danh sách sản phẩm cùng thương hiệu và danh mục
router.get("/products", async (req, res) => {
  try {
    const { parent_id } = req.query; // Lấy parent_id từ query parameter

    let productsQuery = `
      SELECT 
        p.*, 
        b.name AS brand_name, 
        b.logo AS brand_logo, 
        b.origin AS brand_origin,
        c.name AS category_name,
        c.slug AS category_slug,
        c.description AS category_description,
        c.parent_id AS category_parent_id
      FROM products p
      LEFT JOIN brands b ON p.id_brand = b.id
      LEFT JOIN categories c ON p.id_category = c.id
    `;

    // Nếu có parent_id, thêm điều kiện lọc
    if (parent_id) {
      productsQuery += ` WHERE c.parent_id = ?`;
    }

    const [products] = await db.query(productsQuery, parent_id ? [parent_id] : []); // Truyền tham số nếu có
    const [categories] = await db.query(`SELECT * FROM categories`);
    const [brands] = await db.query(`SELECT * FROM brands`);

    // console.log("Fetched products:", products); // Debugging: Log raw products data
    // console.log("Fetched categories:", categories); // Debugging: Log categories
    // console.log("Fetched brands:", brands); // Debugging: Log brands

    const parseJSON = (data) => {
      try {
        return data ? JSON.parse(data) : null;
      } catch (e) {
        // console.error("Error parsing JSON:", e); // Debugging: Log JSON parsing errors
        return null;
      }
    };

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: {
        id: product.id_category,
        name: product.category_name,
        slug: product.category_slug,
        description: product.category_description,
        parent_id: product.category_parent_id,
      },
      brand: {
        id: product.id_brand,
        name: product.brand_name,
        logo: product.brand_logo,
        origin: product.brand_origin,
      },
      price: product.price,
      discount: product.discount,
      stock: product.stock,
      warranty: product.warranty,
      status: product.status,
      description: product.description,
      specifications: parseJSON(product.specifications),
      images: parseJSON(product.images) || [],
      videos: parseJSON(product.videos) || [],
      color_options: parseJSON(product.color_options) || [],
      variants: parseJSON(product.variants) || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));

    // console.log("Formatted products:", formattedProducts); // Debugging: Log formatted products

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        categories,
        brands,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error); // Debugging: Log errors
    res.status(500).json({ success: false, message: "Error fetching products" });
  }
});

// API lấy chi tiết sản phẩm theo ID từ cơ sở dữ liệu
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [productResult] = await db.query(`
      SELECT 
        p.*, 
        b.name AS brand_name, 
        b.logo AS brand_logo, 
        b.origin AS brand_origin,
        c.name AS category_name,
        c.slug AS category_slug,
        c.description AS category_description,
        c.parent_id AS category_parent_id
      FROM products p
      LEFT JOIN brands b ON p.id_brand = b.id
      LEFT JOIN categories c ON p.id_category = c.id
      WHERE p.id = ?
    `, [id]);

    if (productResult.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const product = productResult[0];
    const parseJSON = (data) => {
      try {
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    };

    const formattedProduct = {
      id: product.id,
      name: product.name,
      category: {
        id: product.id_category,
        name: product.category_name,
        slug: product.category_slug,
        description: product.category_description,
        parent_id: product.category_parent_id,
      },
      brand: {
        id: product.id_brand,
        name: product.brand_name,
        logo: product.brand_logo,
        origin: product.brand_origin,
      },
      price: product.price,
      discount: product.discount,
      stock: product.stock,
      warranty: product.warranty,
      status: product.status,
      description: product.description,
      specifications: parseJSON(product.specifications),
      images: parseJSON(product.images) || [],
      videos: parseJSON(product.videos) || [],
      color_options: parseJSON(product.color_options) || [],
      variants: parseJSON(product.variants) || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    res.json({ success: true, data: formattedProduct });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// GET /api/categories - lấy danh sách danh mục từ database
router.get('/categories', async (req, res) => {

  try {
    // Truy vấn lấy dữ liệu từ bảng `categories`
    const [categories] = await db.query(`
      SELECT 
        id, 
        name,
        parent_id, 
        slug, 
        description, 
        created_at, 
        updated_at 
      FROM categories
    `);

    // Trả về danh sách danh mục
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});
router.get('/brands', async (req, res) => {
  try {
    // Truy vấn lấy dữ liệu từ bảng `brands`
    const [brands] = await db.query(`
      SELECT 
        id, 
        name,
        logo, 
        origin, 
        created_at, 
        updated_at 
      FROM brands
    `);

    // Trả về danh sách thương hiệu
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thương hiệu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
