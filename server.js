require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const loginRoute = require("./API/login");
const productsRoute = require("./API/products")
const media_assetsRoute = require("./API/media_assets")
const cartRoutes = require('./API/cart');
const productsManagerRoute = require("./dashboardAPI/product.manager")

// Validate .env setup
if (!process.env.PORT) {
  console.error("Error: .env file is missing or PORT is not defined.");
  process.exit(1);
}

const app = express();
app.use(cookieParser()); // ✅ Sử dụng middleware

const allowedOrigins = [
  "http://localhost:3000",
  "https://tlshop-asvrutnla-trieu3105s-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true
}));

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
app.use("/api", productsManagerRoute)

app.listen(process.env.PORT, () => 
  console.log(`Server running on port ${process.env.PORT}`)
);
