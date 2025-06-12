const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { testConnection, initializeDatabase } = require("./config/database");

// Load environment variables
require("dotenv").config({ path: "./config.env" });

// Import routes
const authRoutes = require("./routes/auth");
const donorRoutes = require("./routes/donors");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy settings for development (React dev server proxy)
if (process.env.NODE_ENV === "development") {
  app.set('trust proxy', 1);
}

// Security middleware - Disabled for internal network compatibility
// Helmet security headers cause issues with HTTP internal network deployment
// app.use(helmet());

// CORS configuration - Allow all origins for internal network use
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Higher limit for development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development on localhost
    if (process.env.NODE_ENV === "development" && 
        (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1")) {
      return true;
    }
    return false;
  },
});

app.use("/api/", limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 100 : 5, // Higher limit for development
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development on localhost
    if (process.env.NODE_ENV === "development" && 
        (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1")) {
      return true;
    }
    return false;
  },
});

app.use("/api/auth", authLimiter);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Blood Donor API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Network diagnostic endpoint
app.get("/network-test", (req, res) => {
  res.json({
    success: true,
    message: "Network connection working!",
    clientIp: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});



// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Blood Donor Registry API",
    version: "1.0.0",
    endpoints: {
      authentication: {
        "POST /api/auth/register": "Register a new user",
        "POST /api/auth/login": "Login user",
        "GET /api/auth/me": "Get current user info",
      },
      donors: {
        "GET /api/donors":
          "Get all donors with filtering and pagination (Public)",
        "GET /api/donors/:id": "Get single donor by ID (Public)",
        "GET /api/donors/blood-type/:bloodType":
          "Get donors by blood type (Public)",
        "POST /api/donors": "Add new donor (Auth Required)",
        "PUT /api/donors/:id": "Update donor (Auth Required)",
        "DELETE /api/donors/:id": "Deactivate donor (Auth Required)",
        "POST /api/donors/:id/donation": "Record new donation (Auth Required)",
      },
    },
    blood_types: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    authentication:
      "Bearer token required for creating, updating, and deleting operations",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);

// Serve static files from React build with proper headers
app.use(express.static(path.join(__dirname, "../frontend/build"), {
  setHeaders: (res, path) => {
    // Add cache headers for static assets
    if (path.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (path.match(/\.(html)$/)) {
      res.setHeader('Cache-Control', 'no-cache'); // Don't cache HTML
    }
  }
}));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get("*", (req, res) => {
  // Only serve React app for non-API routes
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  } else {
    // API 404 handler
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
      path: req.originalUrl,
      method: req.method,
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // Handle specific error types
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }



  // Handle database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({
      success: false,
      message: "Database connection error",
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log(
      "❌ Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔄 Initializing Blood Donor Registry API...");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }

    // Initialize database tables
    await initializeDatabase();

    // Start the server - Listen on all network interfaces for network access
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Blood Donor API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API docs: http://localhost:${PORT}/api`);
      console.log(`🌐 Network access enabled - accessible from other PCs`);
      console.log(`🩸 Ready to manage blood donors!`);
    });

    // Export server for graceful shutdown
    global.server = server;
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the application
startServer();
