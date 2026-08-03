-- ============================================================
-- Investment Monitoring System — PT Kayaba
-- Database: investment_monitoring
-- ============================================================

CREATE DATABASE IF NOT EXISTS investment_monitoring
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE investment_monitoring;

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Investments ----------
CREATE TABLE IF NOT EXISTS investments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  pic VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'Umum',
  stage VARCHAR(50) NOT NULL DEFAULT 'Draft',
  budget DECIMAL(18,2) NOT NULL DEFAULT 0,
  used DECIMAL(18,2) NOT NULL DEFAULT 0,
  invest_progress TINYINT NOT NULL DEFAULT 0,
  pay_step TINYINT NOT NULL DEFAULT 0,
  pay_dp DECIMAL(18,2) NOT NULL DEFAULT 0,
  pay_1 DECIMAL(18,2) NOT NULL DEFAULT 0,
  pay_2 DECIMAL(18,2) NOT NULL DEFAULT 0,
  pay_3 DECIMAL(18,2) NOT NULL DEFAULT 0,
  pay_retention DECIMAL(18,2) NOT NULL DEFAULT 0,
  budget_status ENUM('open','closed') NOT NULL DEFAULT 'open',
  closed_at TIMESTAMP NULL DEFAULT NULL,
  fs_target DECIMAL(18,2) NOT NULL DEFAULT 0,
  fs_actual DECIMAL(18,2) NOT NULL DEFAULT 0,
  rate TINYINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Actions (tindakan perbaikan) ----------
CREATE TABLE IF NOT EXISTS actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  investment_id INT NOT NULL,
  action TEXT NOT NULL,
  owner VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('open','in-progress','done') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Seed data
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE actions;
TRUNCATE TABLE investments;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO investments
  (code, name, pic, category, stage, budget, used, invest_progress, pay_step, fs_target, fs_actual, rate)
VALUES
  ('INV-001', 'Modernisasi Hydraulic Press Line 2', 'Rudi Hartono', 'Mesin & Peralatan', 'MassPro', 1250000000, 1180000000, 100, 5, 85000000, 92400000, 94),
  ('INV-002', 'Penambahan CNC Machining Center', 'Siti Rahayu', 'Mesin & Peralatan', 'PCR', 980000000, 890000000, 92, 4, 60000000, 48500000, 0),
  ('INV-003', 'Upgrade Line Welding Robot', 'Agus Setiawan', 'Otomasi', 'Install & Trial', 1600000000, 1100000000, 68, 3, 120000000, 0, 0),
  ('INV-004', 'Penggantian Pallet Conveyor', 'Budi Santoso', 'Material Handling', 'Fabrication', 720000000, 310000000, 45, 2, 50000000, 0, 0),
  ('INV-005', 'Optimasi Energi Paint Booth', 'Dewi Lestari', 'Utilitas', 'Approved', 540000000, 0, 0, 0, 35000000, 0, 0),
  ('INV-006', 'Ekspansi Armada AGV', 'Hendra Wijaya', 'Otomasi', 'Under Review', 1900000000, 0, 0, 0, 0, 0, 0),
  ('INV-007', 'Otomasi Penyimpanan Press Die', 'Yuni Astuti', 'Material Handling', 'MassPro', 450000000, 430000000, 100, 5, 40000000, 33200000, 71),
  ('INV-008', 'Sistem Kamera Inspeksi', 'Fajar Nugroho', 'Quality', 'MassPro', 210000000, 198000000, 100, 5, 18000000, 19600000, 88),
  ('INV-009', 'Test Rig Hydraulic Cylinder', 'Andi Pratama', 'Mesin & Peralatan', 'Ready for Approval', 380000000, 0, 0, 0, 0, 0, 0),
  ('INV-010', 'Upgrade Kualitas Laser Welding', 'Maya Sari', 'Quality', 'Draft', 260000000, 0, 0, 0, 0, 0, 0);

INSERT INTO actions (investment_id, action, owner, due_date, status)
VALUES
  (2,  'Revisi parameter proses CNC & rekalibrasi tooling', 'Siti Rahayu', '2026-08-15', 'open'),
  (7,  'Investigasi bottleneck alur penyimpanan die', 'Yuni Astuti', '2026-08-10', 'open'),
  (3,  'Akselerasi jadwal commissioning robot', 'Agus Setiawan', '2026-09-01', 'in-progress'),
  (4,  'Review ulang jadwal fabrikasi conveyor', 'Budi Santoso', '2026-08-22', 'open'),
  (1,  'Formalisasi lesson learned proses MassPro', 'Rudi Hartono', '2026-08-05', 'done');
