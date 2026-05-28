-- supabase/schema.sql

-- Setup trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. daily_snapshots
CREATE TABLE daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  created_from_date date NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. daily_expenses
CREATE TABLE daily_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NULL,
  note text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. vehicle_stocks
CREATE TABLE vehicle_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  vehicle_type text NOT NULL,
  brand text NULL,
  model text NOT NULL,
  plate_number text NULL,
  year integer NULL,
  status text NOT NULL,
  purchase_price numeric NOT NULL DEFAULT 0,
  estimated_sell_price numeric NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  note text NULL,
  created_from_id uuid NULL,
  vehicle_group_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3a. vehicle_capital_logs
CREATE TABLE vehicle_capital_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_group_id uuid NOT NULL,
  date date NOT NULL,
  investor_name text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. receivables
CREATE TABLE receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  customer_name text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_date date NULL,
  status text NOT NULL,
  note text NULL,
  created_from_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. debts
CREATE TABLE debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  creditor_name text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_date date NULL,
  status text NOT NULL,
  note text NULL,
  created_from_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. losses
CREATE TABLE losses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  source text DEFAULT 'Manual',
  note text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. bank_accounts
CREATE TABLE bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  bank_name text NOT NULL,
  account_name text NULL,
  account_number text NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  note text NULL,
  created_from_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. bank_transactions
CREATE TABLE bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  category text NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  related_account_id uuid NULL REFERENCES bank_accounts(id) ON DELETE SET NULL,
  transfer_group_id uuid NULL,
  related_source text NULL,
  related_source_id uuid NULL,
  note text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_daily_expenses_date ON daily_expenses(date);
CREATE INDEX idx_vehicle_stocks_date ON vehicle_stocks(date);
CREATE INDEX idx_receivables_date ON receivables(date);
CREATE INDEX idx_debts_date ON debts(date);
CREATE INDEX idx_losses_date ON losses(date);
CREATE INDEX idx_bank_accounts_date ON bank_accounts(date);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(date);
CREATE INDEX idx_bank_transactions_account_id ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_transfer_group_id ON bank_transactions(transfer_group_id);
CREATE INDEX idx_vehicle_capital_logs_group_id ON vehicle_capital_logs(vehicle_group_id);

-- Add updated_at triggers
CREATE TRIGGER set_timestamp_daily_snapshots BEFORE UPDATE ON daily_snapshots FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_daily_expenses BEFORE UPDATE ON daily_expenses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_vehicle_stocks BEFORE UPDATE ON vehicle_stocks FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_receivables BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_debts BEFORE UPDATE ON debts FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_losses BEFORE UPDATE ON losses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_bank_accounts BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_bank_transactions BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
