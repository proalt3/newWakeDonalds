-- Wakedonalds POS - MySQL schema
-- Run this in MySQL to create the database and tables:
--   mysql -u root -p < schema.sql
-- Or create the database first, then run the CREATE TABLE statements.

CREATE DATABASE IF NOT EXISTS wakedonalds;
USE wakedonalds;

-- Users (for login/register; admin = admin@wakedonalds.com)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cat VARCHAR(80) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  emoji VARCHAR(10) DEFAULT '🍽️',
  tag VARCHAR(20) DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders (one row per order; items stored as JSON in same table)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_num VARCHAR(20) NOT NULL UNIQUE,
  customer VARCHAR(100) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  notes TEXT,
  items JSON,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'In Progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles: admin, customer, staff (only these three)
-- Seed admin user (password: admin123 - change in production!)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@wakedonalds.com', 'admin123', 'admin');

-- Default menu is loaded by the app on first use or via API.
