-- ============================================================
-- EduCore SaaS – SQL Server Schema (Migration 001)
-- Multi-tenant: every table carries tenant_id
-- Compatible with: SQL Server 2016+, Azure SQL Database
-- ============================================================

USE EduCoreSaaS;
GO

-- ============================================================
-- TENANTS (root table – one row per school / school chain)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tenants')
BEGIN
    CREATE TABLE tenants (
        id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name           NVARCHAR(200)    NOT NULL,
        address        NVARCHAR(500)    NULL,
        phone          NVARCHAR(20)     NULL,
        email          NVARCHAR(255)    NULL,
        principal_name NVARCHAR(200)    NULL,
        is_active      BIT              NOT NULL DEFAULT 1,
        created_at     DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at     DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tenants PRIMARY KEY (id)
    );
END
GO

-- ============================================================
-- USERS (auth – custom JWT, no NextAuth)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id     UNIQUEIDENTIFIER NOT NULL,
        email         NVARCHAR(255)    NOT NULL,
        password_hash NVARCHAR(MAX)    NOT NULL,
        name          NVARCHAR(200)    NOT NULL,
        role          NVARCHAR(20)     NOT NULL,
        is_active     BIT              NOT NULL DEFAULT 1,
        last_login    DATETIME2(7)     NULL,
        created_at    DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_users PRIMARY KEY (id),
        CONSTRAINT FK_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT UQ_users_tenant_email UNIQUE (tenant_id, email),
        CONSTRAINT CK_users_role CHECK (role IN ('SuperAdmin','SchoolAdmin','Staff','Student'))
    );
    CREATE INDEX IX_users_tenant ON users(tenant_id);
    CREATE INDEX IX_users_email  ON users(email);
END
GO

-- ============================================================
-- STAFF
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'staff')
BEGIN
    CREATE TABLE staff (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id     UNIQUEIDENTIFIER NOT NULL,
        employee_code NVARCHAR(50)     NOT NULL,
        first_name    NVARCHAR(100)    NOT NULL,
        last_name     NVARCHAR(100)    NOT NULL,
        email         NVARCHAR(255)    NOT NULL,
        phone         NVARCHAR(20)     NULL,
        department    NVARCHAR(100)    NOT NULL,
        designation   NVARCHAR(100)    NOT NULL,
        status        NVARCHAR(20)     NOT NULL DEFAULT 'Active',
        join_date     DATE             NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        basic_salary  DECIMAL(12,2)    NOT NULL,
        created_at    DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_staff PRIMARY KEY (id),
        CONSTRAINT FK_staff_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT UQ_staff_emp_code UNIQUE (tenant_id, employee_code),
        CONSTRAINT UQ_staff_email UNIQUE (tenant_id, email),
        CONSTRAINT CK_staff_status CHECK (status IN ('Active','On-Leave','Terminated')),
        CONSTRAINT CK_staff_salary CHECK (basic_salary > 0)
    );
    CREATE INDEX IX_staff_tenant ON staff(tenant_id);
    CREATE INDEX IX_staff_status ON staff(tenant_id, status);
END
GO

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'leave_requests')
BEGIN
    CREATE TABLE leave_requests (
        id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id   UNIQUEIDENTIFIER NOT NULL,
        staff_id    UNIQUEIDENTIFIER NOT NULL,
        leave_type  NVARCHAR(20)     NOT NULL,
        start_date  DATE             NOT NULL,
        end_date    DATE             NOT NULL,
        days        INT              NOT NULL,
        reason      NVARCHAR(MAX)    NULL,
        status      NVARCHAR(20)     NOT NULL DEFAULT 'Pending',
        reviewed_by UNIQUEIDENTIFIER NULL,
        reviewed_at DATETIME2(7)     NULL,
        created_at  DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_leave_requests PRIMARY KEY (id),
        CONSTRAINT FK_leave_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT FK_leave_staff  FOREIGN KEY (staff_id)  REFERENCES staff(id),
        CONSTRAINT FK_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
        CONSTRAINT CK_leave_type   CHECK (leave_type IN ('Casual','Sick','Annual')),
        CONSTRAINT CK_leave_status CHECK (status IN ('Pending','Approved','Rejected')),
        CONSTRAINT CK_leave_days   CHECK (days > 0),
        CONSTRAINT CK_leave_dates  CHECK (end_date >= start_date)
    );
    CREATE INDEX IX_leave_tenant ON leave_requests(tenant_id);
    CREATE INDEX IX_leave_staff  ON leave_requests(staff_id);
    CREATE INDEX IX_leave_status ON leave_requests(tenant_id, status);
END
GO

-- ============================================================
-- PAYROLL
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'payroll')
BEGIN
    CREATE TABLE payroll (
        id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id    UNIQUEIDENTIFIER NOT NULL,
        staff_id     UNIQUEIDENTIFIER NOT NULL,
        month        SMALLINT         NOT NULL,
        year         SMALLINT         NOT NULL,
        basic_salary DECIMAL(12,2)    NOT NULL,
        hra          DECIMAL(12,2)    NOT NULL DEFAULT 0,
        da           DECIMAL(12,2)    NOT NULL DEFAULT 0,
        pf           DECIMAL(12,2)    NOT NULL DEFAULT 0,
        lop_days     SMALLINT         NOT NULL DEFAULT 0,
        lop_amount   DECIMAL(12,2)    NOT NULL DEFAULT 0,
        gross_salary DECIMAL(12,2)    NOT NULL,
        net_salary   DECIMAL(12,2)    NOT NULL,
        status       NVARCHAR(20)     NOT NULL DEFAULT 'Draft',
        processed_at DATETIME2(7)     NULL,
        paid_at      DATETIME2(7)     NULL,
        created_at   DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_payroll PRIMARY KEY (id),
        CONSTRAINT FK_payroll_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT FK_payroll_staff  FOREIGN KEY (staff_id)  REFERENCES staff(id),
        CONSTRAINT UQ_payroll_period UNIQUE (tenant_id, staff_id, month, year),
        CONSTRAINT CK_payroll_month  CHECK (month BETWEEN 1 AND 12),
        CONSTRAINT CK_payroll_year   CHECK (year > 2000),
        CONSTRAINT CK_payroll_status CHECK (status IN ('Draft','Processed','Paid'))
    );
    CREATE INDEX IX_payroll_tenant ON payroll(tenant_id);
    CREATE INDEX IX_payroll_staff  ON payroll(staff_id);
    CREATE INDEX IX_payroll_period ON payroll(tenant_id, year, month);
END
GO

-- ============================================================
-- STUDENTS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'students')
BEGIN
    CREATE TABLE students (
        id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id        UNIQUEIDENTIFIER NOT NULL,
        admission_number NVARCHAR(50)     NOT NULL,
        first_name       NVARCHAR(100)    NOT NULL,
        last_name        NVARCHAR(100)    NOT NULL,
        date_of_birth    DATE             NOT NULL,
        gender           NVARCHAR(10)     NOT NULL,
        class_id         NVARCHAR(50)     NOT NULL,
        class_name       NVARCHAR(100)    NOT NULL,
        section          NVARCHAR(10)     NOT NULL DEFAULT 'A',
        parent_name      NVARCHAR(200)    NOT NULL,
        parent_phone     NVARCHAR(20)     NOT NULL,
        parent_email     NVARCHAR(255)    NULL,
        address          NVARCHAR(500)    NULL,
        status           NVARCHAR(20)     NOT NULL DEFAULT 'Active',
        admission_date   DATE             NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        created_at       DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_students PRIMARY KEY (id),
        CONSTRAINT FK_students_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT UQ_students_admission UNIQUE (tenant_id, admission_number),
        CONSTRAINT CK_students_gender CHECK (gender IN ('Male','Female','Other')),
        CONSTRAINT CK_students_status CHECK (status IN ('Active','Graduated','Withdrawn'))
    );
    CREATE INDEX IX_students_tenant ON students(tenant_id);
    CREATE INDEX IX_students_status ON students(tenant_id, status);
    CREATE INDEX IX_students_class  ON students(tenant_id, class_id);
END
GO

-- ============================================================
-- FEE CATEGORIES
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'fee_categories')
BEGIN
    CREATE TABLE fee_categories (
        id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id        UNIQUEIDENTIFIER NOT NULL,
        name             NVARCHAR(200)    NOT NULL,
        type             NVARCHAR(20)     NOT NULL,
        amount           DECIMAL(12,2)    NOT NULL,
        due_date         DATE             NOT NULL,
        late_fee_per_day DECIMAL(8,2)     NOT NULL DEFAULT 0,
        is_active        BIT              NOT NULL DEFAULT 1,
        created_at       DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at       DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_fee_categories PRIMARY KEY (id),
        CONSTRAINT FK_fee_cat_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT CK_fee_cat_type   CHECK (type IN ('Tuition','Transport','Exams','Other')),
        CONSTRAINT CK_fee_cat_amount CHECK (amount > 0)
    );
    CREATE INDEX IX_fee_cat_tenant ON fee_categories(tenant_id);
END
GO

-- ============================================================
-- FEE PAYMENTS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'fee_payments')
BEGIN
    CREATE TABLE fee_payments (
        id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        tenant_id       UNIQUEIDENTIFIER NOT NULL,
        student_id      UNIQUEIDENTIFIER NOT NULL,
        fee_category_id UNIQUEIDENTIFIER NOT NULL,
        total_amount    DECIMAL(12,2)    NOT NULL,
        paid_amount     DECIMAL(12,2)    NOT NULL DEFAULT 0,
        balance         DECIMAL(12,2)    NOT NULL,
        late_fee        DECIMAL(12,2)    NOT NULL DEFAULT 0,
        receipt_number  NVARCHAR(50)     NULL,
        payment_date    DATE             NULL,
        payment_mode    NVARCHAR(20)     NULL,
        status          NVARCHAR(20)     NOT NULL DEFAULT 'Pending',
        created_at      DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_fee_payments PRIMARY KEY (id),
        CONSTRAINT FK_fee_pay_tenant   FOREIGN KEY (tenant_id)       REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT FK_fee_pay_student  FOREIGN KEY (student_id)      REFERENCES students(id),
        CONSTRAINT FK_fee_pay_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id),
        CONSTRAINT UQ_fee_receipt      UNIQUE (receipt_number),
        CONSTRAINT CK_fee_pay_mode     CHECK (payment_mode IN ('Cash','Online','Cheque') OR payment_mode IS NULL),
        CONSTRAINT CK_fee_pay_status   CHECK (status IN ('Pending','Partial','Paid'))
    );
    CREATE INDEX IX_fee_pay_tenant  ON fee_payments(tenant_id);
    CREATE INDEX IX_fee_pay_student ON fee_payments(student_id);
    CREATE INDEX IX_fee_pay_status  ON fee_payments(tenant_id, status);
END
GO

-- ============================================================
-- AUDIT LOG
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'audit_log')
BEGIN
    CREATE TABLE audit_log (
        id         BIGINT           NOT NULL IDENTITY(1,1),
        tenant_id  UNIQUEIDENTIFIER NOT NULL,
        user_id    UNIQUEIDENTIFIER NULL,
        action     NVARCHAR(100)    NOT NULL,
        table_name NVARCHAR(100)    NOT NULL,
        record_id  UNIQUEIDENTIFIER NULL,
        old_data   NVARCHAR(MAX)    NULL,
        new_data   NVARCHAR(MAX)    NULL,
        ip_address NVARCHAR(50)     NULL,
        created_at DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_audit_log PRIMARY KEY (id)
    );
    CREATE INDEX IX_audit_tenant  ON audit_log(tenant_id);
    CREATE INDEX IX_audit_table   ON audit_log(table_name, record_id);
    CREATE INDEX IX_audit_created ON audit_log(created_at DESC);
END
GO
