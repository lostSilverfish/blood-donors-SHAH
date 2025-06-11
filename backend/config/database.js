const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./config.env" });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "blood_donor_registry",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection (without specific database)
const testConnection = async () => {
  try {
    // Create a temporary connection without database to test MySQL connection
    const tempConfig = { ...dbConfig };
    delete tempConfig.database; // Remove database from connection
    
    const tempPool = mysql.createPool(tempConfig);
    const connection = await tempPool.getConnection();
    console.log("✅ Connected to MySQL server successfully");
    connection.release();
    await tempPool.end();
    return true;
  } catch (error) {
    console.error("❌ Error connecting to MySQL server:", error.message);
    return false;
  }
};

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    // First, connect without specifying database to create it
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    const tempConnection = await tempPool.getConnection();
    
    // Create database if it doesn't exist
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`
    );
    console.log(`✅ Database '${dbConfig.database}' created/verified`);
    
    tempConnection.release();
    await tempPool.end();
    
    // Now connect with the database specified
    const connection = await pool.getConnection();
    console.log(`✅ Connected to database '${dbConfig.database}'`);

    // Create users table for authentication
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create donors table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS donors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        donor_name VARCHAR(100) NOT NULL,
        blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
        date_of_last_donation DATE,
        contact_number VARCHAR(20) NOT NULL,
        next_donation_date DATE,
        email VARCHAR(100),
        address TEXT,
        age INT,
        weight DECIMAL(5,2),
        medical_conditions TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_blood_type (blood_type),
        INDEX idx_next_donation_date (next_donation_date),
        INDEX idx_is_active (is_active)
      )
    `);

    // Migration: Add user_id column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE donors 
        ADD COLUMN user_id INT NULL AFTER id,
        ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        ADD INDEX idx_user_id (user_id)
      `);
      console.log("✅ Added user_id column to donors table");
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("✅ user_id column already exists in donors table");
      } else {
        console.log("Migration note:", error.message);
      }
    }

    // Create donation history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS donation_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        donor_id INT NOT NULL,
        donation_date DATE NOT NULL,
        blood_units DECIMAL(3,1) DEFAULT 1.0,
        donation_center VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
        INDEX idx_donor_id (donor_id),
        INDEX idx_donation_date (donation_date)
      )
    `);

    console.log("✅ Database and tables initialized successfully");
    connection.release();
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
};
