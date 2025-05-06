require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const loginRoute = require("./API/login");
const productsRoute = require("./API/products");
const media_assetsRoute = require("./API/media_assets");
const cartRoutes = require('./API/cart');
const productsManagerRoute = require("./dashboardAPI/product.manager");

// Validate .env setup
if (!process.env.PORT) {
  console.error("Error: .env file is missing or PORT is not defined.");
  process.exit(1);
}

const app = express();
app.use(cookieParser()); // ✅ Sử dụng middleware

const allowedOrigins = [];

if (process.env.NODE_ENV === "production") {
  if (process.env.FRONTEND_URL_VERCEL) {
    allowedOrigins.push(process.env.FRONTEND_URL_VERCEL);
  }
} else {
  allowedOrigins.push("http://localhost:3000"); // Ensure localhost is allowed in development
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., Postman or server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed.`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend đang chạy!" });
});

const userRoutes = require("./API/user");
app.use("/api", userRoutes);

app.use("/api", loginRoute);
app.use("/api", productsRoute);
app.use("/api", media_assetsRoute);
app.use('/api/', cartRoutes);
app.use("/api", productsManagerRoute);

app.listen(process.env.PORT, () => 
  console.log(`Server running on port ${process.env.PORT}`)
);
