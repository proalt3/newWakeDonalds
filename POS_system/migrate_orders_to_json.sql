-- Run this ONCE in phpMyAdmin (SQL tab) to switch to orders.items and remove order_items.
-- Requires MySQL 8.0+ for JSON_ARRAYAGG.

USE wakedonalds;

-- Add items column to orders
ALTER TABLE orders ADD COLUMN items JSON NULL AFTER notes;

-- Copy existing order_items into orders.items
UPDATE orders o
INNER JOIN (
  SELECT order_id,
    JSON_ARRAYAGG(JSON_OBJECT('name', name, 'price', price, 'qty', qty, 'emoji', IFNULL(emoji, '🍽️'))) AS items_json
  FROM order_items
  GROUP BY order_id
) t ON o.id = t.order_id
SET o.items = t.items_json;

-- Remove the order_items table
DROP TABLE IF EXISTS order_items;
