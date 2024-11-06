const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

dotenv.config();

const app = express();
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require("./routes/conversation");
const messageRoute = require("./routes/messages");

app.use(cors());

// Database connection
mongoose
     .connect(process.env.MONGO_URL)
     .then(() => {
          console.log("Connected to MongoDB");
     })
     .catch((err) => {
          console.error("Failed to connect to MongoDB", err);
     });

// Middleware
app.use("/images", express.static(path.join(__dirname, "public", "images"))); // Serve static files from 'public/images'
app.use(express.json()); // Parse JSON bodies
app.use(helmet()); // Security middleware
app.use(morgan("common")); // HTTP request logger

// Multer configuration
const storage = multer.diskStorage({
     destination: (req, file, cb) => {
          cb(null, "public/images"); // Set destination folder for uploads
     },
     filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + path.extname(file.originalname); // Append timestamp to original filename
          cb(null, file.fieldname + "-" + uniqueSuffix); // Set file name
     },
});

const upload = multer({
     storage: storage,
     limits: { fileSize: 2 * 1024 * 1024 }, // Set file size limit (e.g., 2MB)
     fileFilter: (req, file, cb) => {
          // Accept images only (optional)
          const filetypes = /jpeg|jpg|png|gif/;
          const extname = filetypes.test(
               path.extname(file.originalname).toLowerCase()
          );
          const mimetype = filetypes.test(file.mimetype);

          if (mimetype && extname) {
               return cb(null, true);
          } else {
               cb(new Error("Only images are allowed!"));
          }
     },
});

// Route to handle file upload
app.post("/api/upload", upload.single("file"), (req, res) => {
     if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
     }

     try {
          return res.status(200).json({
               message: "File uploaded successfully",
               filePath: `/images/${req.file.filename}`,
          });
     } catch (err) {
          res.status(500).json({ message: "File upload failed", error: err.message });
     }
});

// Routes
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/posts", postRoute);

// Start the server
app.listen(8800, () => {
     console.log("Backend server is running on port 8800!");
});
