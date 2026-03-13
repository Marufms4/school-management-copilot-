-- ============================================================
-- EduCore SaaS – PostgreSQL Stored Procedures (Migration 002)
-- All SPs are SECURITY DEFINER and schema-qualified.
-- Calling convention:  SELECT * FROM sp_name($1, $2, ...)
-- ============================================================

-- ============================================================
-- SALARY COMPONENT RATES (edit these to adjust school-wide rates)
-- These are used inside sp_process_payroll.
-- ============================================================
--   HRA_RATE        = 40%  of basic
--   DA_RATE         = 15%  of basic
--   PF_RATE         = 12%  of basic
--   WORKING_DAYS    = 26   per month (for LOP per-day calculation)

-- ============================================================
-- HELPER: auto-update updated_at column
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_updated_at') THEN
        CREATE TRIGGER trg_staff_updated_at
            BEFORE UPDATE ON staff
            FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_cat_updated_at') THEN
        CREATE TRIGGER trg_fee_cat_updated_at
            BEFORE UPDATE ON fee_categories
            FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_pay_updated_at') THEN
        CREATE TRIGGER trg_fee_pay_updated_at
            BEFORE UPDATE ON fee_payments
            FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenants_updated_at') THEN
        CREATE TRIGGER trg_tenants_updated_at
            BEFORE UPDATE ON tenants
            FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    END IF;
END $$;

-- ============================================================
-- AUTH
-- ============================================================

-- sp_authenticate_user: look up user by email + tenant, return
-- row only when found (password verification done in app layer).
CREATE OR REPLACE FUNCTION sp_authenticate_user(
    p_tenant_id UUID,
    p_email     TEXT
)
RETURNS TABLE (
    id            UUID,
    tenant_id     UUID,
    email         TEXT,
    password_hash TEXT,
    name          TEXT,
    role          TEXT,
    is_active     BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.tenant_id, u.email, u.password_hash, u.name, u.role, u.is_active
    FROM   users u
    WHERE  u.tenant_id = p_tenant_id
      AND  u.email     = p_email
      AND  u.is_active = TRUE;
END;
$$;

-- sp_update_last_login: stamp last_login after successful auth.
CREATE OR REPLACE FUNCTION sp_update_last_login(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE users SET last_login = NOW() WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- STAFF
-- ============================================================

-- sp_get_staff: list all staff for a tenant (optional status filter)
CREATE OR REPLACE FUNCTION sp_get_staff(
    p_tenant_id UUID,
    p_status    TEXT DEFAULT NULL
)
RETURNS TABLE (
    id            UUID,
    tenant_id     UUID,
    employee_code TEXT,
    first_name    TEXT,
    last_name     TEXT,
    email         TEXT,
    phone         TEXT,
    department    TEXT,
    designation   TEXT,
    status        TEXT,
    join_date     DATE,
    basic_salary  NUMERIC,
    created_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.tenant_id, s.employee_code, s.first_name, s.last_name,
           s.email, s.phone, s.department, s.designation, s.status,
           s.join_date, s.basic_salary, s.created_at, s.updated_at
    FROM   staff s
    WHERE  s.tenant_id = p_tenant_id
      AND  (p_status IS NULL OR s.status = p_status)
    ORDER BY s.first_name, s.last_name;
END;
$$;

-- sp_get_staff_by_id: single staff record
CREATE OR REPLACE FUNCTION sp_get_staff_by_id(
    p_tenant_id UUID,
    p_staff_id  UUID
)
RETURNS TABLE (
    id            UUID,
    tenant_id     UUID,
    employee_code TEXT,
    first_name    TEXT,
    last_name     TEXT,
    email         TEXT,
    phone         TEXT,
    department    TEXT,
    designation   TEXT,
    status        TEXT,
    join_date     DATE,
    basic_salary  NUMERIC,
    created_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.tenant_id, s.employee_code, s.first_name, s.last_name,
           s.email, s.phone, s.department, s.designation, s.status,
           s.join_date, s.basic_salary, s.created_at, s.updated_at
    FROM   staff s
    WHERE  s.tenant_id = p_tenant_id
      AND  s.id        = p_staff_id;
END;
$$;

-- sp_create_staff: insert a new staff member, return created row
CREATE OR REPLACE FUNCTION sp_create_staff(
    p_tenant_id   UUID,
    p_first_name  TEXT,
    p_last_name   TEXT,
    p_email       TEXT,
    p_phone       TEXT,
    p_department  TEXT,
    p_designation TEXT,
    p_basic_salary NUMERIC,
    p_join_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id            UUID,
    tenant_id     UUID,
    employee_code TEXT,
    first_name    TEXT,
    last_name     TEXT,
    email         TEXT,
    phone         TEXT,
    department    TEXT,
    designation   TEXT,
    status        TEXT,
    join_date     DATE,
    basic_salary  NUMERIC,
    created_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_emp_code TEXT;
    v_new_id   UUID;
BEGIN
    -- Generate employee code: EMP + year + zero-padded count
    SELECT 'EMP' || TO_CHAR(NOW(), 'YYYY') ||
           LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO   v_emp_code
    FROM   staff
    WHERE  staff.tenant_id = p_tenant_id;

    INSERT INTO staff (tenant_id, employee_code, first_name, last_name, email,
                       phone, department, designation, basic_salary, join_date)
    VALUES (p_tenant_id, v_emp_code, p_first_name, p_last_name, p_email,
            p_phone, p_department, p_designation, p_basic_salary, p_join_date)
    RETURNING id INTO v_new_id;

    RETURN QUERY SELECT * FROM sp_get_staff_by_id(p_tenant_id, v_new_id);
END;
$$;

-- sp_update_staff_status: change status (Active / On-Leave / Terminated)
CREATE OR REPLACE FUNCTION sp_update_staff_status(
    p_tenant_id UUID,
    p_staff_id  UUID,
    p_status    TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE staff
    SET    status     = p_status,
           updated_at = NOW()
    WHERE  tenant_id = p_tenant_id
      AND  id        = p_staff_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Staff record not found';
    END IF;
END;
$$;

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================

-- sp_get_leave_requests: list leave requests for a tenant
-- (optionally scoped to one staff member, or by status)
CREATE OR REPLACE FUNCTION sp_get_leave_requests(
    p_tenant_id UUID,
    p_staff_id  UUID  DEFAULT NULL,
    p_status    TEXT  DEFAULT NULL
)
RETURNS TABLE (
    id          UUID,
    tenant_id   UUID,
    staff_id    UUID,
    staff_name  TEXT,
    leave_type  TEXT,
    start_date  DATE,
    end_date    DATE,
    days        INTEGER,
    reason      TEXT,
    status      TEXT,
    created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT lr.id, lr.tenant_id, lr.staff_id,
           s.first_name || ' ' || s.last_name AS staff_name,
           lr.leave_type, lr.start_date, lr.end_date, lr.days,
           lr.reason, lr.status, lr.created_at
    FROM   leave_requests lr
    JOIN   staff s ON s.id = lr.staff_id
    WHERE  lr.tenant_id = p_tenant_id
      AND  (p_staff_id IS NULL OR lr.staff_id = p_staff_id)
      AND  (p_status   IS NULL OR lr.status   = p_status)
    ORDER BY lr.created_at DESC;
END;
$$;

-- sp_create_leave_request
CREATE OR REPLACE FUNCTION sp_create_leave_request(
    p_tenant_id UUID,
    p_staff_id  UUID,
    p_leave_type TEXT,
    p_start_date DATE,
    p_end_date   DATE,
    p_reason     TEXT DEFAULT NULL
)
RETURNS TABLE (
    id         UUID,
    tenant_id  UUID,
    staff_id   UUID,
    leave_type TEXT,
    start_date DATE,
    end_date   DATE,
    days       INTEGER,
    reason     TEXT,
    status     TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_days     INTEGER;
    v_new_id   UUID;
BEGIN
    -- Count business days (simple: calendar days + 1)
    v_days := (p_end_date - p_start_date) + 1;

    INSERT INTO leave_requests (tenant_id, staff_id, leave_type,
                                start_date, end_date, days, reason)
    VALUES (p_tenant_id, p_staff_id, p_leave_type,
            p_start_date, p_end_date, v_days, p_reason)
    RETURNING id INTO v_new_id;

    RETURN QUERY
    SELECT lr.id, lr.tenant_id, lr.staff_id, lr.leave_type,
           lr.start_date, lr.end_date, lr.days, lr.reason,
           lr.status, lr.created_at
    FROM   leave_requests lr
    WHERE  lr.id = v_new_id;
END;
$$;

-- sp_update_leave_status: approve or reject a leave request
CREATE OR REPLACE FUNCTION sp_update_leave_status(
    p_tenant_id   UUID,
    p_leave_id    UUID,
    p_status      TEXT,
    p_reviewer_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE leave_requests
    SET    status      = p_status,
           reviewed_by = p_reviewer_id,
           reviewed_at = NOW()
    WHERE  id        = p_leave_id
      AND  tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Leave request not found';
    END IF;
END;
$$;

-- sp_count_approved_lop_days: count approved leave days in a given month/year
-- Used by payroll to compute Loss-of-Pay automatically.
CREATE OR REPLACE FUNCTION sp_count_approved_lop_days(
    p_tenant_id UUID,
    p_staff_id  UUID,
    p_month     SMALLINT,
    p_year      SMALLINT
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_days INTEGER := 0;
    v_period_start DATE;
    v_period_end   DATE;
BEGIN
    v_period_start := MAKE_DATE(p_year, p_month, 1);
    v_period_end   := (v_period_start + INTERVAL '1 month - 1 day')::DATE;

    SELECT COALESCE(SUM(
        -- Clamp leave range to within the requested month
        (LEAST(lr.end_date, v_period_end) - GREATEST(lr.start_date, v_period_start)) + 1
    ), 0)
    INTO   v_days
    FROM   leave_requests lr
    WHERE  lr.tenant_id = p_tenant_id
      AND  lr.staff_id  = p_staff_id
      AND  lr.status    = 'Approved'
      AND  lr.start_date <= v_period_end
      AND  lr.end_date   >= v_period_start;

    RETURN v_days;
END;
$$;

-- ============================================================
-- PAYROLL
-- ============================================================

-- sp_process_payroll: calculate and persist one payroll record.
-- Salary formula:
--   HRA        = basic * 40%
--   DA         = basic * 15%
--   PF         = basic * 12%
--   LOP amount = (basic / 26) * lop_days   (26 working days)
--   Gross      = basic + HRA + DA
--   Net        = Gross - PF - LOP_amount
CREATE OR REPLACE FUNCTION sp_process_payroll(
    p_tenant_id UUID,
    p_staff_id  UUID,
    p_month     SMALLINT,
    p_year      SMALLINT,
    p_lop_days  SMALLINT DEFAULT NULL  -- NULL = auto-calculate from approved leaves
)
RETURNS TABLE (
    id           UUID,
    tenant_id    UUID,
    staff_id     UUID,
    month        SMALLINT,
    year         SMALLINT,
    basic_salary NUMERIC,
    hra          NUMERIC,
    da           NUMERIC,
    pf           NUMERIC,
    lop_days     SMALLINT,
    lop_amount   NUMERIC,
    gross_salary NUMERIC,
    net_salary   NUMERIC,
    status       TEXT,
    processed_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_basic      NUMERIC;
    v_hra        NUMERIC;
    v_da         NUMERIC;
    v_pf         NUMERIC;
    v_lop_days   SMALLINT;
    v_lop_amount NUMERIC;
    v_gross      NUMERIC;
    v_net        NUMERIC;
    v_new_id     UUID;
BEGIN
    -- Fetch basic salary
    SELECT basic_salary INTO v_basic
    FROM   staff
    WHERE  id = p_staff_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Staff % not found in tenant %', p_staff_id, p_tenant_id;
    END IF;

    -- Determine LOP days
    IF p_lop_days IS NULL THEN
        v_lop_days := sp_count_approved_lop_days(p_tenant_id, p_staff_id, p_month, p_year);
    ELSE
        v_lop_days := p_lop_days;
    END IF;

    -- Salary components (percentage-based on basic)
    -- Rates: HRA=40%, DA=15%, PF=12% (see top-of-file constants)
    v_hra        := ROUND(v_basic * 0.40, 2);  -- HRA_RATE
    v_da         := ROUND(v_basic * 0.15, 2);  -- DA_RATE
    v_pf         := ROUND(v_basic * 0.12, 2);  -- PF_RATE
    v_lop_amount := ROUND((v_basic / 26.0) * v_lop_days, 2);  -- WORKING_DAYS
    v_gross      := v_basic + v_hra + v_da;
    v_net        := ROUND(v_gross - v_pf - v_lop_amount, 2);

    -- Upsert: if already exists update, otherwise insert
    INSERT INTO payroll (tenant_id, staff_id, month, year,
                         basic_salary, hra, da, pf,
                         lop_days, lop_amount, gross_salary, net_salary,
                         status, processed_at)
    VALUES (p_tenant_id, p_staff_id, p_month, p_year,
            v_basic, v_hra, v_da, v_pf,
            v_lop_days, v_lop_amount, v_gross, v_net,
            'Processed', NOW())
    ON CONFLICT (tenant_id, staff_id, month, year)
    DO UPDATE SET
        basic_salary = EXCLUDED.basic_salary,
        hra          = EXCLUDED.hra,
        da           = EXCLUDED.da,
        pf           = EXCLUDED.pf,
        lop_days     = EXCLUDED.lop_days,
        lop_amount   = EXCLUDED.lop_amount,
        gross_salary = EXCLUDED.gross_salary,
        net_salary   = EXCLUDED.net_salary,
        status       = 'Processed',
        processed_at = NOW()
    RETURNING id INTO v_new_id;

    RETURN QUERY
    SELECT p.id, p.tenant_id, p.staff_id, p.month, p.year,
           p.basic_salary, p.hra, p.da, p.pf,
           p.lop_days, p.lop_amount, p.gross_salary, p.net_salary,
           p.status, p.processed_at
    FROM   payroll p
    WHERE  p.id = v_new_id;
END;
$$;

-- sp_get_payroll: list payroll records for a tenant
CREATE OR REPLACE FUNCTION sp_get_payroll(
    p_tenant_id UUID,
    p_staff_id  UUID    DEFAULT NULL,
    p_month     SMALLINT DEFAULT NULL,
    p_year      SMALLINT DEFAULT NULL
)
RETURNS TABLE (
    id           UUID,
    tenant_id    UUID,
    staff_id     UUID,
    staff_name   TEXT,
    month        SMALLINT,
    year         SMALLINT,
    basic_salary NUMERIC,
    hra          NUMERIC,
    da           NUMERIC,
    pf           NUMERIC,
    lop_days     SMALLINT,
    lop_amount   NUMERIC,
    gross_salary NUMERIC,
    net_salary   NUMERIC,
    status       TEXT,
    processed_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.tenant_id, p.staff_id,
           s.first_name || ' ' || s.last_name AS staff_name,
           p.month, p.year, p.basic_salary, p.hra, p.da, p.pf,
           p.lop_days, p.lop_amount, p.gross_salary, p.net_salary,
           p.status, p.processed_at
    FROM   payroll p
    JOIN   staff s ON s.id = p.staff_id
    WHERE  p.tenant_id = p_tenant_id
      AND  (p_staff_id IS NULL OR p.staff_id = p_staff_id)
      AND  (p_month    IS NULL OR p.month    = p_month)
      AND  (p_year     IS NULL OR p.year     = p_year)
    ORDER BY p.year DESC, p.month DESC, s.first_name;
END;
$$;

-- sp_mark_payroll_paid
CREATE OR REPLACE FUNCTION sp_mark_payroll_paid(
    p_tenant_id UUID,
    p_payroll_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE payroll
    SET    status  = 'Paid',
           paid_at = NOW()
    WHERE  id        = p_payroll_id
      AND  tenant_id = p_tenant_id
      AND  status    = 'Processed';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payroll record not found or not in Processed status';
    END IF;
END;
$$;

-- ============================================================
-- STUDENTS
-- ============================================================

-- sp_get_students
CREATE OR REPLACE FUNCTION sp_get_students(
    p_tenant_id UUID,
    p_status    TEXT  DEFAULT NULL,
    p_class_id  TEXT  DEFAULT NULL
)
RETURNS TABLE (
    id               UUID,
    tenant_id        UUID,
    admission_number TEXT,
    first_name       TEXT,
    last_name        TEXT,
    date_of_birth    DATE,
    gender           TEXT,
    class_id         TEXT,
    class_name       TEXT,
    section          TEXT,
    parent_name      TEXT,
    parent_phone     TEXT,
    parent_email     TEXT,
    address          TEXT,
    status           TEXT,
    admission_date   DATE,
    created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.tenant_id, s.admission_number, s.first_name, s.last_name,
           s.date_of_birth, s.gender, s.class_id, s.class_name, s.section,
           s.parent_name, s.parent_phone, s.parent_email, s.address,
           s.status, s.admission_date, s.created_at
    FROM   students s
    WHERE  s.tenant_id = p_tenant_id
      AND  (p_status   IS NULL OR s.status   = p_status)
      AND  (p_class_id IS NULL OR s.class_id = p_class_id)
    ORDER BY s.admission_date DESC, s.first_name;
END;
$$;

-- sp_admit_student: create a new student record
CREATE OR REPLACE FUNCTION sp_admit_student(
    p_tenant_id    UUID,
    p_first_name   TEXT,
    p_last_name    TEXT,
    p_date_of_birth DATE,
    p_gender       TEXT,
    p_class_id     TEXT,
    p_class_name   TEXT,
    p_section      TEXT,
    p_parent_name  TEXT,
    p_parent_phone TEXT,
    p_parent_email TEXT  DEFAULT NULL,
    p_address      TEXT  DEFAULT NULL,
    p_admission_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id               UUID,
    tenant_id        UUID,
    admission_number TEXT,
    first_name       TEXT,
    last_name        TEXT,
    date_of_birth    DATE,
    gender           TEXT,
    class_id         TEXT,
    class_name       TEXT,
    section          TEXT,
    parent_name      TEXT,
    parent_phone     TEXT,
    parent_email     TEXT,
    address          TEXT,
    status           TEXT,
    admission_date   DATE,
    created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_adm_num TEXT;
    v_new_id  UUID;
BEGIN
    -- Admission number: ADM + year + zero-padded count per tenant
    SELECT 'ADM' || TO_CHAR(p_admission_date, 'YYYY') ||
           LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO   v_adm_num
    FROM   students
    WHERE  students.tenant_id = p_tenant_id
      AND  EXTRACT(YEAR FROM admission_date) = EXTRACT(YEAR FROM p_admission_date);

    INSERT INTO students (tenant_id, admission_number, first_name, last_name,
                          date_of_birth, gender, class_id, class_name, section,
                          parent_name, parent_phone, parent_email, address,
                          admission_date)
    VALUES (p_tenant_id, v_adm_num, p_first_name, p_last_name,
            p_date_of_birth, p_gender, p_class_id, p_class_name, p_section,
            p_parent_name, p_parent_phone, p_parent_email, p_address,
            p_admission_date)
    RETURNING id INTO v_new_id;

    RETURN QUERY
    SELECT s.id, s.tenant_id, s.admission_number, s.first_name, s.last_name,
           s.date_of_birth, s.gender, s.class_id, s.class_name, s.section,
           s.parent_name, s.parent_phone, s.parent_email, s.address,
           s.status, s.admission_date, s.created_at
    FROM   students s
    WHERE  s.id = v_new_id;
END;
$$;

-- sp_promote_student: move student to the next class
CREATE OR REPLACE FUNCTION sp_promote_student(
    p_tenant_id    UUID,
    p_student_id   UUID,
    p_new_class_id TEXT,
    p_new_class_name TEXT,
    p_new_section  TEXT DEFAULT 'A'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE students
    SET    class_id   = p_new_class_id,
           class_name = p_new_class_name,
           section    = p_new_section
    WHERE  id        = p_student_id
      AND  tenant_id = p_tenant_id
      AND  status    = 'Active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found or not Active';
    END IF;
END;
$$;

-- sp_update_student_status (Graduate / Withdraw)
CREATE OR REPLACE FUNCTION sp_update_student_status(
    p_tenant_id  UUID,
    p_student_id UUID,
    p_status     TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE students
    SET    status = p_status
    WHERE  id        = p_student_id
      AND  tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;
END;
$$;

-- ============================================================
-- FEE CATEGORIES
-- ============================================================

CREATE OR REPLACE FUNCTION sp_get_fee_categories(
    p_tenant_id UUID,
    p_type      TEXT DEFAULT NULL
)
RETURNS TABLE (
    id               UUID,
    tenant_id        UUID,
    name             TEXT,
    type             TEXT,
    amount           NUMERIC,
    due_date         DATE,
    late_fee_per_day NUMERIC,
    is_active        BOOLEAN,
    created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT fc.id, fc.tenant_id, fc.name, fc.type, fc.amount,
           fc.due_date, fc.late_fee_per_day, fc.is_active, fc.created_at
    FROM   fee_categories fc
    WHERE  fc.tenant_id = p_tenant_id
      AND  fc.is_active = TRUE
      AND  (p_type IS NULL OR fc.type = p_type)
    ORDER BY fc.type, fc.name;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_fee_category(
    p_tenant_id        UUID,
    p_name             TEXT,
    p_type             TEXT,
    p_amount           NUMERIC,
    p_due_date         DATE,
    p_late_fee_per_day NUMERIC DEFAULT 0
)
RETURNS TABLE (
    id               UUID,
    tenant_id        UUID,
    name             TEXT,
    type             TEXT,
    amount           NUMERIC,
    due_date         DATE,
    late_fee_per_day NUMERIC,
    is_active        BOOLEAN,
    created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_new_id UUID;
BEGIN
    INSERT INTO fee_categories (tenant_id, name, type, amount, due_date, late_fee_per_day)
    VALUES (p_tenant_id, p_name, p_type, p_amount, p_due_date, p_late_fee_per_day)
    RETURNING id INTO v_new_id;

    RETURN QUERY
    SELECT fc.id, fc.tenant_id, fc.name, fc.type, fc.amount,
           fc.due_date, fc.late_fee_per_day, fc.is_active, fc.created_at
    FROM   fee_categories fc
    WHERE  fc.id = v_new_id;
END;
$$;

-- ============================================================
-- FEE PAYMENTS
-- ============================================================

-- sp_get_fee_payments: list payments for a tenant
CREATE OR REPLACE FUNCTION sp_get_fee_payments(
    p_tenant_id  UUID,
    p_student_id UUID  DEFAULT NULL,
    p_status     TEXT  DEFAULT NULL
)
RETURNS TABLE (
    id               UUID,
    tenant_id        UUID,
    student_id       UUID,
    student_name     TEXT,
    fee_category_id  UUID,
    fee_category_name TEXT,
    total_amount     NUMERIC,
    paid_amount      NUMERIC,
    balance          NUMERIC,
    late_fee         NUMERIC,
    receipt_number   TEXT,
    payment_date     DATE,
    payment_mode     TEXT,
    status           TEXT,
    created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT fp.id, fp.tenant_id, fp.student_id,
           s.first_name || ' ' || s.last_name AS student_name,
           fp.fee_category_id, fc.name AS fee_category_name,
           fp.total_amount, fp.paid_amount, fp.balance, fp.late_fee,
           fp.receipt_number, fp.payment_date, fp.payment_mode,
           fp.status, fp.created_at
    FROM   fee_payments fp
    JOIN   students      s  ON s.id  = fp.student_id
    JOIN   fee_categories fc ON fc.id = fp.fee_category_id
    WHERE  fp.tenant_id  = p_tenant_id
      AND  (p_student_id IS NULL OR fp.student_id = p_student_id)
      AND  (p_status     IS NULL OR fp.status     = p_status)
    ORDER BY fp.created_at DESC;
END;
$$;

-- sp_record_fee_payment: record a (partial) fee payment.
--   • Auto-calculates late fee from fee_categories.late_fee_per_day
--   • Sets status to Paid / Partial / Pending based on balance
--   • Generates receipt number (only when paid_amount > 0)
CREATE OR REPLACE FUNCTION sp_record_fee_payment(
    p_tenant_id      UUID,
    p_student_id     UUID,
    p_fee_category_id UUID,
    p_paid_amount    NUMERIC,
    p_payment_mode   TEXT,
    p_payment_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id               UUID,
    tenant_id        UUID,
    student_id       UUID,
    fee_category_id  UUID,
    total_amount     NUMERIC,
    paid_amount      NUMERIC,
    balance          NUMERIC,
    late_fee         NUMERIC,
    receipt_number   TEXT,
    payment_date     DATE,
    payment_mode     TEXT,
    status           TEXT,
    created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_category       fee_categories%ROWTYPE;
    v_late_fee       NUMERIC;
    v_total          NUMERIC;
    v_balance        NUMERIC;
    v_status         TEXT;
    v_receipt        TEXT;
    v_new_id         UUID;
    v_overdue_days   INTEGER;
BEGIN
    -- Fetch fee category (tenant-scoped)
    SELECT * INTO v_category
    FROM   fee_categories
    WHERE  id = p_fee_category_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fee category % not found', p_fee_category_id;
    END IF;

    -- Late fee calculation
    v_overdue_days := GREATEST(0, (p_payment_date - v_category.due_date));
    v_late_fee     := ROUND(v_overdue_days * v_category.late_fee_per_day, 2);

    -- Totals
    v_total   := v_category.amount;
    v_balance := GREATEST(0, v_total + v_late_fee - p_paid_amount);

    -- Payment status
    IF    v_balance <= 0              THEN v_status := 'Paid';
    ELSIF p_paid_amount > 0           THEN v_status := 'Partial';
    ELSE                                   v_status := 'Pending';
    END IF;

    -- Receipt number (only for actual payments)
    IF p_paid_amount > 0 THEN
        v_receipt := 'RCP-' ||
                     UPPER(LEFT(p_tenant_id::TEXT, 4)) || '-' ||
                     TO_CHAR(p_payment_date, 'YYYYMMDD') || '-' ||
                     LPAD((
                         SELECT COUNT(*) + 1 FROM fee_payments
                         WHERE tenant_id = p_tenant_id
                           AND payment_date = p_payment_date
                     )::TEXT, 4, '0');
    ELSE
        v_receipt := NULL;
    END IF;

    INSERT INTO fee_payments (tenant_id, student_id, fee_category_id,
                              total_amount, paid_amount, balance, late_fee,
                              receipt_number, payment_date, payment_mode, status)
    VALUES (p_tenant_id, p_student_id, p_fee_category_id,
            v_total, p_paid_amount, v_balance, v_late_fee,
            v_receipt, p_payment_date, p_payment_mode, v_status)
    RETURNING id INTO v_new_id;

    RETURN QUERY
    SELECT fp.id, fp.tenant_id, fp.student_id, fp.fee_category_id,
           fp.total_amount, fp.paid_amount, fp.balance, fp.late_fee,
           fp.receipt_number, fp.payment_date, fp.payment_mode,
           fp.status, fp.created_at
    FROM   fee_payments fp
    WHERE  fp.id = v_new_id;
END;
$$;

-- sp_get_pending_fees_summary: total outstanding fees per tenant
CREATE OR REPLACE FUNCTION sp_get_pending_fees_summary(p_tenant_id UUID)
RETURNS TABLE (
    total_pending  NUMERIC,
    total_late_fee NUMERIC,
    record_count   BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(balance), 0)   AS total_pending,
           COALESCE(SUM(late_fee), 0)  AS total_late_fee,
           COUNT(*)                    AS record_count
    FROM   fee_payments
    WHERE  tenant_id = p_tenant_id
      AND  status IN ('Pending', 'Partial');
END;
$$;

-- ============================================================
-- DASHBOARD ANALYTICS
-- ============================================================

-- sp_get_dashboard_stats: top-level KPIs for a tenant
CREATE OR REPLACE FUNCTION sp_get_dashboard_stats(p_tenant_id UUID)
RETURNS TABLE (
    total_students   BIGINT,
    total_staff      BIGINT,
    monthly_revenue  NUMERIC,
    monthly_expense  NUMERIC,
    pending_fees     NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_this_month  DATE := DATE_TRUNC('month', NOW())::DATE;
    v_this_year   SMALLINT := EXTRACT(YEAR  FROM NOW())::SMALLINT;
    v_this_month_num SMALLINT := EXTRACT(MONTH FROM NOW())::SMALLINT;
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM students s
         WHERE  s.tenant_id = p_tenant_id AND s.status = 'Active')   AS total_students,

        (SELECT COUNT(*) FROM staff st
         WHERE  st.tenant_id = p_tenant_id AND st.status = 'Active') AS total_staff,

        -- Monthly revenue = sum of fee payments received this month
        COALESCE((
            SELECT SUM(fp.paid_amount)
            FROM   fee_payments fp
            WHERE  fp.tenant_id    = p_tenant_id
              AND  fp.payment_date >= v_this_month
              AND  fp.payment_date <  (v_this_month + INTERVAL '1 month')::DATE
        ), 0) AS monthly_revenue,

        -- Monthly expense = sum of net salaries paid this month
        COALESCE((
            SELECT SUM(p.net_salary)
            FROM   payroll p
            WHERE  p.tenant_id = p_tenant_id
              AND  p.month     = v_this_month_num
              AND  p.year      = v_this_year
              AND  p.status    = 'Paid'
        ), 0) AS monthly_expense,

        -- Pending fees
        COALESCE((
            SELECT SUM(fp.balance)
            FROM   fee_payments fp
            WHERE  fp.tenant_id = p_tenant_id
              AND  fp.status IN ('Pending', 'Partial')
        ), 0) AS pending_fees;
END;
$$;

-- sp_get_revenue_trend: monthly revenue vs expense for the last N months
CREATE OR REPLACE FUNCTION sp_get_revenue_trend(
    p_tenant_id UUID,
    p_months    INTEGER DEFAULT 12
)
RETURNS TABLE (
    month_label TEXT,
    revenue     NUMERIC,
    expense     NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT generate_series(
            DATE_TRUNC('month', NOW() - ((p_months - 1) || ' months')::INTERVAL),
            DATE_TRUNC('month', NOW()),
            '1 month'::INTERVAL
        )::DATE AS period_start
    ),
    rev AS (
        SELECT DATE_TRUNC('month', fp.payment_date)::DATE AS period_start,
               SUM(fp.paid_amount) AS revenue
        FROM   fee_payments fp
        WHERE  fp.tenant_id = p_tenant_id
        GROUP BY 1
    ),
    exp AS (
        SELECT MAKE_DATE(p.year, p.month, 1) AS period_start,
               SUM(p.net_salary) AS expense
        FROM   payroll p
        WHERE  p.tenant_id = p_tenant_id
          AND  p.status    = 'Paid'
        GROUP BY 1
    )
    SELECT
        TO_CHAR(m.period_start, 'Mon YY')          AS month_label,
        COALESCE(r.revenue, 0)                      AS revenue,
        COALESCE(e.expense, 0)                      AS expense
    FROM   months m
    LEFT   JOIN rev r ON r.period_start = m.period_start
    LEFT   JOIN exp e ON e.period_start = m.period_start
    ORDER BY m.period_start;
END;
$$;

-- ============================================================
-- MULTI-SCHOOL (SuperAdmin) – chain of schools view
-- ============================================================

CREATE OR REPLACE FUNCTION sp_get_all_schools_summary()
RETURNS TABLE (
    id               UUID,
    name             TEXT,
    address          TEXT,
    phone            TEXT,
    email            TEXT,
    principal_name   TEXT,
    total_students   BIGINT,
    total_staff      BIGINT,
    monthly_revenue  NUMERIC,
    monthly_expense  NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_this_month     DATE     := DATE_TRUNC('month', NOW())::DATE;
    v_this_year      SMALLINT := EXTRACT(YEAR  FROM NOW())::SMALLINT;
    v_this_month_num SMALLINT := EXTRACT(MONTH FROM NOW())::SMALLINT;
BEGIN
    RETURN QUERY
    SELECT
        t.id, t.name, t.address, t.phone, t.email, t.principal_name,
        (SELECT COUNT(*) FROM students s  WHERE s.tenant_id  = t.id AND s.status  = 'Active'),
        (SELECT COUNT(*) FROM staff st    WHERE st.tenant_id = t.id AND st.status = 'Active'),
        COALESCE((
            SELECT SUM(fp.paid_amount)
            FROM   fee_payments fp
            WHERE  fp.tenant_id    = t.id
              AND  fp.payment_date >= v_this_month
              AND  fp.payment_date <  (v_this_month + INTERVAL '1 month')::DATE
        ), 0),
        COALESCE((
            SELECT SUM(p.net_salary)
            FROM   payroll p
            WHERE  p.tenant_id = t.id
              AND  p.month     = v_this_month_num
              AND  p.year      = v_this_year
              AND  p.status    = 'Paid'
        ), 0)
    FROM tenants t
    WHERE t.is_active = TRUE
    ORDER BY t.name;
END;
$$;
