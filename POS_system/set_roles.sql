-- Run once in phpMyAdmin (wakedonalds database) to set roles.
-- Only three roles: admin, customer, staff.

USE wakedonalds;

-- Set admin user to role 'admin' (in case they were created with old seed)
UPDATE users SET role = 'admin' WHERE email = 'admin@wakedonalds.com';

-- Optional: add a staff user (password: staff123). Remove the INSERT if you don't want it.
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Staff', 'staff@wakedonalds.com', 'staff123', 'staff');

-- Ensure everyone else is customer (optional safety)
-- UPDATE users SET role = 'customer' WHERE role NOT IN ('admin', 'staff');
