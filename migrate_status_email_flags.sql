-- Run this if your orders table already exists (to add status email tracking columns).
-- This prevents duplicate "Ready for Pickup" and "Picked Up" emails when re-marking orders.
-- mysql -u root -p wakedonalds < migrate_status_email_flags.sql

ALTER TABLE orders ADD COLUMN ready_email_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN picked_up_email_sent TINYINT(1) NOT NULL DEFAULT 0;
