CREATE TABLE IF NOT EXISTS customer (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  nrc_no VARCHAR(100) NOT NULL,
  phone_no VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  date_of_birth DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
  id SERIAL PRIMARY KEY,
  account_no VARCHAR(100) UNIQUE NOT NULL,
  open_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  customer_id INTEGER REFERENCES customer(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS charge_item (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  charge_type VARCHAR(100) NOT NULL,
  charge_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255),
  UNIQUE (charge_type, charge_amount)
);

CREATE TABLE IF NOT EXISTS account_charge (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  date DATE NOT NULL,
  account_id INTEGER REFERENCES account(id) ON DELETE CASCADE,
  charge_id INTEGER REFERENCES charge_item(id) ON DELETE SET NULL,
  UNIQUE (account_id, charge_id)
);

CREATE TABLE IF NOT EXISTS account_charge_line_item (

  id SERIAL PRIMARY KEY,

  account_id INTEGER REFERENCES account(id) ON DELETE CASCADE,

  account_charge_id INTEGER REFERENCES account_charge(id) ON DELETE CASCADE,

  charge_id INTEGER REFERENCES charge_item(id) ON DELETE SET NULL,

  amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,

  description VARCHAR(255),

  date DATE NOT NULL

);


CREATE TABLE IF NOT EXISTS loan_type (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  default_interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  max_term INTEGER NOT NULL,
  max_loan_amount DECIMAL(15, 2) NOT NULL
);


CREATE TABLE IF NOT EXISTS loan (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  account_id INTEGER REFERENCES account(id) ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customer(id) ON DELETE RESTRICT,
  loan_type_id INTEGER REFERENCES loan_type(id) ON DELETE RESTRICT,
  interest_rate DECIMAL(5, 2) NOT NULL,
  loan_amount DECIMAL(15, 2) NOT NULL,
  start_date DATE NOT NULL,
  loan_term INTEGER NOT NULL, -- in months
  loan_status VARCHAR(50) DEFAULT 'Pending',
  outstanding_balance DECIMAL(15, 2) NOT NULL
);


CREATE TABLE IF NOT EXISTS loan_disbursement_line_item (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  loan_id INTEGER REFERENCES loan(id) ON DELETE CASCADE,
  disbursement_amount DECIMAL(15, 2) NOT NULL,
  disbursement_date DATE NOT NULL
);


CREATE TABLE IF NOT EXISTS loan_schedule (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  loan_id INTEGER REFERENCES loan(id) ON DELETE CASCADE,
  installment_no INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Unpaid',
  UNIQUE (loan_id, installment_no)
);


CREATE TABLE IF NOT EXISTS loan_payment (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  loan_id INTEGER REFERENCES loan(id) ON DELETE RESTRICT,
  total_paid DECIMAL(15, 2) NOT NULL,
  outstanding_balance DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_payment_line_item (
  id SERIAL PRIMARY KEY,
  loan_payment_id INTEGER REFERENCES loan_payment(id) ON DELETE CASCADE,
  loan_schedule_id INTEGER REFERENCES loan_schedule(id) ON DELETE RESTRICT,
  amount_paid DECIMAL(15, 2) NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  applied_interest_rate DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (loan_payment_id, loan_schedule_id)
);

CREATE TABLE IF NOT EXISTS entry_type (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- 'Debit' or 'Credit'
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_type (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'Single Transfer', 'Payroll Transfer', 'Deposit', 'Withdrawal'
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS transaction_status (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- 'Pending', 'Completed', 'Failed'
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS transfer_batch (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  batch_type VARCHAR(100) NOT NULL, -- e.g. 'Payroll'
  batch_date DATE NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS transaction (
  id SERIAL PRIMARY KEY,
  transaction_code VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  remark VARCHAR(255),
  transaction_type_id INTEGER REFERENCES transaction_type(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES transfer_batch(id) ON DELETE SET NULL,
  status_id INTEGER REFERENCES transaction_status(id) ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS transfer_line_item (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transaction(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES account(id) ON DELETE RESTRICT,
  entry_type_id INTEGER REFERENCES entry_type(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description VARCHAR(255),
  UNIQUE (transaction_id, account_id, entry_type_id)
);
