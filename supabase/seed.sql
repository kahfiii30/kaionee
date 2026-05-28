-- supabase/seed.sql

-- Clear existing data
TRUNCATE vehicle_capital_logs, bank_transactions, bank_accounts, losses, debts, receivables, vehicle_stocks, daily_expenses, daily_snapshots RESTART IDENTITY CASCADE;

-- Insert Daily Snapshots
INSERT INTO daily_snapshots (date) VALUES ('2026-05-27'), ('2026-05-28');

-------------------------------------------------------------------------------
-- DATE: 2026-05-27
-------------------------------------------------------------------------------

-- Bank Accounts (2026-05-27)
INSERT INTO bank_accounts (id, date, bank_name, account_name, account_number, opening_balance, closing_balance) VALUES
('11111111-1111-1111-1111-111111111111', '2026-05-27', 'BCA Operasional', 'PT Project 6', '1234567890', 90000000, 100000000),
('22222222-2222-2222-2222-222222222222', '2026-05-27', 'Mandiri Cadangan', 'PT Project 6', '9876543210', 50000000, 50000000),
('33333333-3333-3333-3333-333333333333', '2026-05-27', 'BRI Piutang', 'PT Project 6', '555666777', 25000000, 25000000);

-- Vehicle Stocks (2026-05-27)
INSERT INTO vehicle_stocks (id, vehicle_group_id, date, vehicle_type, brand, model, plate_number, year, status, purchase_price, estimated_sell_price, sell_price) VALUES
('44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444441', '2026-05-27', 'Mobil', 'Toyota', 'Avanza', 'B 1234 ABC', 2020, 'Ready', 145000000, 158000000, 0),
('44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444442', '2026-05-27', 'Mobil', 'Honda', 'Brio', 'B 7788 XYZ', 2019, 'Ready', 132000000, 145000000, 0),
('44444444-4444-4444-4444-444444444443', '44444444-4444-4444-4444-444444444443', '2026-05-27', 'Motor', 'Yamaha', 'NMAX', 'B 4321 DEF', 2022, 'Ready', 23000000, 27500000, 0),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '2026-05-27', 'Motor', 'Honda', 'Beat', 'B 2222 KLM', 2021, 'Servis', 12000000, 14500000, 0);

-- Vehicle Capital Logs (Patungan)
INSERT INTO vehicle_capital_logs (vehicle_group_id, date, investor_name, description, amount, type) VALUES
('44444444-4444-4444-4444-444444444441', '2026-05-27', 'Si A', 'Modal Patungan', 100000000, 'Patungan'),
('44444444-4444-4444-4444-444444444441', '2026-05-27', 'Si B', 'Modal Patungan', 45000000, 'Patungan'),
('44444444-4444-4444-4444-444444444442', '2026-05-27', 'Si A', 'Modal Penuh', 132000000, 'Patungan'),
('44444444-4444-4444-4444-444444444443', '2026-05-27', 'Si C', 'Modal Penuh', 23000000, 'Patungan'),
('44444444-4444-4444-4444-444444444444', '2026-05-27', 'Si A', 'Modal Penuh', 12000000, 'Patungan');

-- Receivables (2026-05-27)
INSERT INTO receivables (id, date, customer_name, description, amount, paid_amount, status) VALUES
('55555555-5555-5555-5555-555555555551', '2026-05-27', 'Budi', 'DP mobil Avanza', 15000000, 2000000, 'Sebagian'),
('55555555-5555-5555-5555-555555555552', '2026-05-27', 'Sari', 'Cicilan motor Beat', 4000000, 0, 'Belum Dibayar');

-- Debts (2026-05-27)
INSERT INTO debts (id, date, creditor_name, description, amount, paid_amount, status) VALUES
('66666666-6666-6666-6666-666666666661', '2026-05-27', 'Supplier A', 'Pembelian unit Brio', 50000000, 0, 'Belum Dibayar'),
('66666666-6666-6666-6666-666666666662', '2026-05-27', 'Bengkel Jaya', 'Servis unit stok', 2500000, 0, 'Belum Dibayar');


-------------------------------------------------------------------------------
-- DATE: 2026-05-28
-------------------------------------------------------------------------------

-- Bank Accounts (2026-05-28)
INSERT INTO bank_accounts (id, date, bank_name, account_name, account_number, opening_balance, closing_balance, created_from_id) VALUES
('11111111-1111-1111-1111-111111111112', '2026-05-28', 'BCA Operasional', 'PT Project 6', '1234567890', 100000000, 114650000, '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222223', '2026-05-28', 'Mandiri Cadangan', 'PT Project 6', '9876543210', 50000000, 45000000, '22222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333334', '2026-05-28', 'BRI Piutang', 'PT Project 6', '555666777', 25000000, 28000000, '33333333-3333-3333-3333-333333333333');

-- Vehicle Stocks (2026-05-28)
INSERT INTO vehicle_stocks (date, vehicle_group_id, vehicle_type, brand, model, plate_number, year, status, purchase_price, estimated_sell_price, sell_price, created_from_id) VALUES
('2026-05-28', '44444444-4444-4444-4444-444444444441', 'Mobil', 'Toyota', 'Avanza', 'B 1234 ABC', 2020, 'Ready', 145000000, 158000000, 0, '44444444-4444-4444-4444-444444444441'),
('2026-05-28', '44444444-4444-4444-4444-444444444442', 'Mobil', 'Honda', 'Brio', 'B 7788 XYZ', 2019, 'Booking', 132000000, 145000000, 0, '44444444-4444-4444-4444-444444444442'),
('2026-05-28', '44444444-4444-4444-4444-444444444443', 'Motor', 'Yamaha', 'NMAX', 'B 4321 DEF', 2022, 'Ready', 23000000, 27500000, 0, '44444444-4444-4444-4444-444444444443'),
('2026-05-28', '44444444-4444-4444-4444-444444444444', 'Motor', 'Honda', 'Beat', 'B 2222 KLM', 2021, 'Servis', 12000000, 14500000, 0, '44444444-4444-4444-4444-444444444444');

-- Receivables (2026-05-28)
INSERT INTO receivables (date, customer_name, description, amount, paid_amount, status, created_from_id) VALUES
('2026-05-28', 'Budi', 'DP mobil Avanza', 15000000, 5000000, 'Sebagian', '55555555-5555-5555-5555-555555555551'),
('2026-05-28', 'Sari', 'Cicilan motor Beat', 4000000, 0, 'Belum Dibayar', '55555555-5555-5555-5555-555555555552');

-- Debts (2026-05-28)
INSERT INTO debts (date, creditor_name, description, amount, paid_amount, status, created_from_id) VALUES
('2026-05-28', 'Supplier A', 'Pembelian unit Brio', 50000000, 0, 'Belum Dibayar', '66666666-6666-6666-6666-666666666661'),
('2026-05-28', 'Bengkel Jaya', 'Servis unit stok', 2500000, 500000, 'Sebagian', '66666666-6666-6666-6666-666666666662');

-- Daily Expenses (2026-05-28)
INSERT INTO daily_expenses (date, category, description, amount, payment_method) VALUES
('2026-05-28', 'Operasional', 'Bensin dan parkir', 350000, 'BCA Operasional'),
('2026-05-28', 'Iklan', 'Boost marketplace', 500000, 'Tunai'),
('2026-05-28', 'Servis', 'Cuci unit', 150000, 'Tunai');

-- Losses (2026-05-28)
INSERT INTO losses (date, category, description, amount, source) VALUES
('2026-05-28', 'Diskon', 'Diskon unit lama', 1500000, 'Manual');

-- Bank Transactions (2026-05-28)
INSERT INTO bank_transactions (date, bank_account_id, transaction_type, description, amount) VALUES
('2026-05-28', '11111111-1111-1111-1111-111111111112', 'Masuk', 'Setoran penjualan', 15000000),
('2026-05-28', '11111111-1111-1111-1111-111111111112', 'Keluar', 'Bayar bensin dan parkir', 350000),
('2026-05-28', '22222222-2222-2222-2222-222222222223', 'Keluar', 'Bayar supplier', 5000000),
('2026-05-28', '33333333-3333-3333-3333-333333333334', 'Masuk', 'Cicilan customer', 3000000);
