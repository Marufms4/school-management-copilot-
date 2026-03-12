-- ============================================================
-- EduCore SaaS – PostgreSQL Schema (Migration 001)
-- Multi-tenant: every table carries tenant_id
-- ============================================================

-- ------------------------------------
-- Extension: uuid generation
-- ------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS (root table – one row per school / school chain)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    address       TEXT,
    phone         VARCHAR(20),
    email         VARCHAR(255),
    principal_name TEXT,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (auth – custom JWT, no NextAuth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    password_hash TEXT        NOT NULL,
    name          TEXT        NOT NULL,
    role          TEXT        NOT NULL CHECK (role IN ('SuperAdmin','SchoolAdmin','Staff','Student')),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_code  VARCHAR(50) NOT NULL,
    first_name     TEXT        NOT NULL,
    last_name      TEXT        NOT NULL,
    email          VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    department     TEXT        NOT NULL,
    designation    TEXT        NOT NULL,
    status         TEXT        NOT NULL DEFAULT 'Active'
                               CHECK (status IN ('Active','On-Leave','Terminated')),
    join_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
    basic_salary   NUMERIC(12,2) NOT NULL CHECK (basic_salary > 0),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, employee_code),
    UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(tenant_id, status);

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id     UUID        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    leave_type   TEXT        NOT NULL CHECK (leave_type IN ('Casual','Sick','Annual')),
    start_date   DATE        NOT NULL,
    end_date     DATE        NOT NULL,
    days         INTEGER     NOT NULL CHECK (days > 0),
    reason       TEXT,
    status       TEXT        NOT NULL DEFAULT 'Pending'
                             CHECK (status IN ('Pending','Approved','Rejected')),
    reviewed_by  UUID        REFERENCES users(id),
    reviewed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT leave_date_order CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_tenant      ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_staff       ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_status      ON leave_requests(tenant_id, status);

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id      UUID        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    month         SMALLINT    NOT NULL CHECK (month BETWEEN 1 AND 12),
    year          SMALLINT    NOT NULL CHECK (year > 2000),
    basic_salary  NUMERIC(12,2) NOT NULL,
    hra           NUMERIC(12,2) NOT NULL DEFAULT 0,
    da            NUMERIC(12,2) NOT NULL DEFAULT 0,
    pf            NUMERIC(12,2) NOT NULL DEFAULT 0,
    lop_days      SMALLINT    NOT NULL DEFAULT 0,
    lop_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    gross_salary  NUMERIC(12,2) NOT NULL,
    net_salary    NUMERIC(12,2) NOT NULL,
    status        TEXT        NOT NULL DEFAULT 'Draft'
                              CHECK (status IN ('Draft','Processed','Paid')),
    processed_at  TIMESTAMPTZ,
    paid_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, staff_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_tenant    ON payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_staff     ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period    ON payroll(tenant_id, year, month);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) NOT NULL,
    first_name       TEXT        NOT NULL,
    last_name        TEXT        NOT NULL,
    date_of_birth    DATE        NOT NULL,
    gender           TEXT        NOT NULL CHECK (gender IN ('Male','Female','Other')),
    class_id         TEXT        NOT NULL,
    class_name       TEXT        NOT NULL,
    section          TEXT        NOT NULL DEFAULT 'A',
    parent_name      TEXT        NOT NULL,
    parent_phone     VARCHAR(20) NOT NULL,
    parent_email     VARCHAR(255),
    address          TEXT,
    status           TEXT        NOT NULL DEFAULT 'Active'
                                 CHECK (status IN ('Active','Graduated','Withdrawn')),
    admission_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, admission_number)
);

CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_students_class  ON students(tenant_id, class_id);

-- ============================================================
-- FEE CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_categories (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name             TEXT        NOT NULL,
    type             TEXT        NOT NULL CHECK (type IN ('Tuition','Transport','Exams','Other')),
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    due_date         DATE        NOT NULL,
    late_fee_per_day NUMERIC(8,2)  NOT NULL DEFAULT 0,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_cat_tenant ON fee_categories(tenant_id);

-- ============================================================
-- FEE PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_payments (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id       UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_category_id  UUID        NOT NULL REFERENCES fee_categories(id),
    total_amount     NUMERIC(12,2) NOT NULL,
    paid_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance          NUMERIC(12,2) NOT NULL,
    late_fee         NUMERIC(12,2) NOT NULL DEFAULT 0,
    receipt_number   VARCHAR(50)  UNIQUE,
    payment_date     DATE,
    payment_mode     TEXT        CHECK (payment_mode IN ('Cash','Online','Cheque')),
    status           TEXT        NOT NULL DEFAULT 'Pending'
                                 CHECK (status IN ('Pending','Partial','Paid')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_pay_tenant   ON fee_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fee_pay_student  ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_pay_status   ON fee_payments(tenant_id, status);

-- ============================================================
-- AUDIT LOG (optional but recommended for SaaS)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL   PRIMARY KEY,
    tenant_id   UUID        NOT NULL,
    user_id     UUID,
    action      TEXT        NOT NULL,
    table_name  TEXT        NOT NULL,
    record_id   UUID,
    old_data    JSONB,
    new_data    JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant    ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_table     ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_log(created_at DESC);
