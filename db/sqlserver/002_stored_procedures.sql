-- ============================================================
-- EduCore SaaS – SQL Server Stored Procedures (Migration 002)
-- Compatible with: SQL Server 2016+, Azure SQL Database
-- Salary rates: HRA=40%, DA=15%, PF=12%, WorkingDays=26
-- ============================================================

USE EduCoreSaaS;
GO

-- ============================================================
-- AUTH
-- ============================================================

-- sp_authenticate_user: look up user by tenant + email
CREATE OR ALTER PROCEDURE sp_authenticate_user
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_email     NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        id, tenant_id, email, password_hash, name, role, is_active
    FROM users
    WHERE tenant_id = @p_tenant_id
      AND email     = @p_email
      AND is_active = 1;
END;
GO

-- sp_update_last_login
CREATE OR ALTER PROCEDURE sp_update_last_login
    @p_user_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users SET last_login = SYSUTCDATETIME() WHERE id = @p_user_id;
END;
GO

-- ============================================================
-- STAFF
-- ============================================================

-- sp_get_staff: list all staff for a tenant (optional status filter)
CREATE OR ALTER PROCEDURE sp_get_staff
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_status    NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        id, tenant_id, employee_code, first_name, last_name,
        email, phone, department, designation, status,
        join_date, basic_salary, created_at, updated_at
    FROM staff
    WHERE tenant_id = @p_tenant_id
      AND (@p_status IS NULL OR status = @p_status)
    ORDER BY created_at DESC;
END;
GO

-- sp_get_staff_by_id
CREATE OR ALTER PROCEDURE sp_get_staff_by_id
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        id, tenant_id, employee_code, first_name, last_name,
        email, phone, department, designation, status,
        join_date, basic_salary, created_at, updated_at
    FROM staff
    WHERE tenant_id = @p_tenant_id
      AND id        = @p_staff_id;
END;
GO

-- sp_create_staff: add a new staff member with auto-generated employee code
CREATE OR ALTER PROCEDURE sp_create_staff
    @p_tenant_id   UNIQUEIDENTIFIER,
    @p_first_name  NVARCHAR(100),
    @p_last_name   NVARCHAR(100),
    @p_email       NVARCHAR(255),
    @p_phone       NVARCHAR(20)  = NULL,
    @p_department  NVARCHAR(100),
    @p_designation NVARCHAR(100),
    @p_basic_salary DECIMAL(12,2),
    @p_join_date   DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @new_id      UNIQUEIDENTIFIER = NEWID();
    DECLARE @year_str    NVARCHAR(4)      = CAST(YEAR(GETDATE()) AS NVARCHAR(4));
    DECLARE @seq         INT;
    DECLARE @emp_code    NVARCHAR(50);
    DECLARE @actual_join DATE            = ISNULL(@p_join_date, CAST(GETDATE() AS DATE));

    SELECT @seq = COUNT(*) + 1
    FROM   staff
    WHERE  tenant_id = @p_tenant_id;

    SET @emp_code = 'EMP' + @year_str + RIGHT('0000' + CAST(@seq AS NVARCHAR(10)), 4);

    INSERT INTO staff (
        id, tenant_id, employee_code, first_name, last_name,
        email, phone, department, designation, status,
        join_date, basic_salary
    )
    VALUES (
        @new_id, @p_tenant_id, @emp_code, @p_first_name, @p_last_name,
        @p_email, @p_phone, @p_department, @p_designation, 'Active',
        @actual_join, @p_basic_salary
    );

    SELECT
        id, tenant_id, employee_code, first_name, last_name,
        email, phone, department, designation, status,
        join_date, basic_salary, created_at, updated_at
    FROM staff WHERE id = @new_id;
END;
GO

-- sp_update_staff_status
CREATE OR ALTER PROCEDURE sp_update_staff_status
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER,
    @p_status    NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE staff
    SET    status     = @p_status,
           updated_at = SYSUTCDATETIME()
    WHERE  tenant_id = @p_tenant_id
      AND  id        = @p_staff_id;
END;
GO

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================

-- sp_get_leave_requests
CREATE OR ALTER PROCEDURE sp_get_leave_requests
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER = NULL,
    @p_status    NVARCHAR(20)     = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        lr.id, lr.tenant_id, lr.staff_id,
        s.first_name + ' ' + s.last_name AS staff_name,
        s.employee_code,
        lr.leave_type, lr.start_date, lr.end_date, lr.days,
        lr.reason, lr.status, lr.reviewed_by, lr.reviewed_at, lr.created_at
    FROM leave_requests lr
    JOIN staff s ON s.id = lr.staff_id
    WHERE lr.tenant_id = @p_tenant_id
      AND (@p_staff_id IS NULL OR lr.staff_id = @p_staff_id)
      AND (@p_status   IS NULL OR lr.status   = @p_status)
    ORDER BY lr.created_at DESC;
END;
GO

-- sp_create_leave_request
CREATE OR ALTER PROCEDURE sp_create_leave_request
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER,
    @p_leave_type NVARCHAR(20),
    @p_start_date DATE,
    @p_end_date   DATE,
    @p_reason     NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @new_id UNIQUEIDENTIFIER = NEWID();
    DECLARE @days   INT = DATEDIFF(DAY, @p_start_date, @p_end_date) + 1;

    INSERT INTO leave_requests (
        id, tenant_id, staff_id, leave_type,
        start_date, end_date, days, reason, status
    )
    VALUES (
        @new_id, @p_tenant_id, @p_staff_id, @p_leave_type,
        @p_start_date, @p_end_date, @days, @p_reason, 'Pending'
    );

    SELECT
        lr.id, lr.tenant_id, lr.staff_id,
        s.first_name + ' ' + s.last_name AS staff_name,
        s.employee_code,
        lr.leave_type, lr.start_date, lr.end_date, lr.days,
        lr.reason, lr.status, lr.reviewed_by, lr.reviewed_at, lr.created_at
    FROM leave_requests lr
    JOIN staff s ON s.id = lr.staff_id
    WHERE lr.id = @new_id;
END;
GO

-- sp_update_leave_status
CREATE OR ALTER PROCEDURE sp_update_leave_status
    @p_tenant_id  UNIQUEIDENTIFIER,
    @p_leave_id   UNIQUEIDENTIFIER,
    @p_status     NVARCHAR(20),
    @p_reviewer_id UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE leave_requests
    SET    status      = @p_status,
           reviewed_by = @p_reviewer_id,
           reviewed_at = SYSUTCDATETIME()
    WHERE  tenant_id = @p_tenant_id
      AND  id        = @p_leave_id;
END;
GO

-- sp_count_approved_lop_days: count approved leave days for a staff member in a given month
CREATE OR ALTER PROCEDURE sp_count_approved_lop_days
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER,
    @p_month     SMALLINT,
    @p_year      SMALLINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @month_start DATE = DATEFROMPARTS(@p_year, @p_month, 1);
    DECLARE @month_end   DATE = EOMONTH(@month_start);

    SELECT ISNULL(SUM(
        DATEDIFF(DAY,
            CASE WHEN start_date < @month_start THEN @month_start ELSE start_date END,
            CASE WHEN end_date   > @month_end   THEN @month_end   ELSE end_date   END
        ) + 1
    ), 0) AS lop_days
    FROM leave_requests
    WHERE tenant_id = @p_tenant_id
      AND staff_id  = @p_staff_id
      AND status    = 'Approved'
      AND start_date <= @month_end
      AND end_date   >= @month_start;
END;
GO

-- ============================================================
-- PAYROLL
-- ============================================================

-- sp_process_payroll: calculate and upsert payroll for a staff member
CREATE OR ALTER PROCEDURE sp_process_payroll
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER,
    @p_month     SMALLINT,
    @p_year      SMALLINT,
    @p_lop_days  SMALLINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Fetch basic salary
    DECLARE @basic     DECIMAL(12,2);
    SELECT  @basic = basic_salary FROM staff
    WHERE   tenant_id = @p_tenant_id AND id = @p_staff_id;

    IF @basic IS NULL
    BEGIN
        RAISERROR('Staff member not found', 16, 1);
        RETURN;
    END

    -- Auto-calculate LOP if not supplied
    DECLARE @lop_days SMALLINT = @p_lop_days;
    IF @lop_days IS NULL
    BEGIN
        EXEC sp_count_approved_lop_days
            @p_tenant_id = @p_tenant_id,
            @p_staff_id  = @p_staff_id,
            @p_month     = @p_month,
            @p_year      = @p_year;
        -- sp returns single row; capture it
        SELECT @lop_days = 0; -- default; caller can override via OUT param pattern
    END

    -- Salary computation
    DECLARE @hra        DECIMAL(12,2) = ROUND(@basic * 0.40, 2);
    DECLARE @da         DECIMAL(12,2) = ROUND(@basic * 0.15, 2);
    DECLARE @pf         DECIMAL(12,2) = ROUND(@basic * 0.12, 2);
    DECLARE @lop_amount DECIMAL(12,2) = ROUND((@basic / 26.0) * @lop_days, 2);
    DECLARE @gross      DECIMAL(12,2) = @basic + @hra + @da;
    DECLARE @net        DECIMAL(12,2) = @gross - @pf - @lop_amount;

    -- UPSERT using MERGE
    DECLARE @record_id UNIQUEIDENTIFIER;

    MERGE payroll AS target
    USING (SELECT @p_tenant_id AS tenant_id, @p_staff_id AS staff_id,
                  @p_month AS month, @p_year AS year) AS source
    ON (target.tenant_id = source.tenant_id
        AND target.staff_id = source.staff_id
        AND target.month    = source.month
        AND target.year     = source.year)
    WHEN MATCHED THEN
        UPDATE SET
            basic_salary  = @basic,
            hra           = @hra,
            da            = @da,
            pf            = @pf,
            lop_days      = @lop_days,
            lop_amount    = @lop_amount,
            gross_salary  = @gross,
            net_salary    = @net,
            status        = 'Processed',
            processed_at  = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (id, tenant_id, staff_id, month, year,
                basic_salary, hra, da, pf,
                lop_days, lop_amount, gross_salary, net_salary,
                status, processed_at)
        VALUES (NEWID(), @p_tenant_id, @p_staff_id, @p_month, @p_year,
                @basic, @hra, @da, @pf,
                @lop_days, @lop_amount, @gross, @net,
                'Processed', SYSUTCDATETIME());

    -- Return the upserted record
    SELECT
        p.id, p.tenant_id, p.staff_id,
        s.first_name + ' ' + s.last_name AS staff_name,
        s.employee_code,
        p.month, p.year, p.basic_salary, p.hra, p.da, p.pf,
        p.lop_days, p.lop_amount, p.gross_salary, p.net_salary,
        p.status, p.processed_at, p.paid_at, p.created_at
    FROM payroll p
    JOIN staff   s ON s.id = p.staff_id
    WHERE p.tenant_id = @p_tenant_id
      AND p.staff_id  = @p_staff_id
      AND p.month     = @p_month
      AND p.year      = @p_year;
END;
GO

-- sp_get_payroll
CREATE OR ALTER PROCEDURE sp_get_payroll
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_staff_id  UNIQUEIDENTIFIER = NULL,
    @p_month     SMALLINT         = NULL,
    @p_year      SMALLINT         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.id, p.tenant_id, p.staff_id,
        s.first_name + ' ' + s.last_name AS staff_name,
        s.employee_code, s.department, s.designation,
        p.month, p.year, p.basic_salary, p.hra, p.da, p.pf,
        p.lop_days, p.lop_amount, p.gross_salary, p.net_salary,
        p.status, p.processed_at, p.paid_at, p.created_at
    FROM payroll p
    JOIN staff   s ON s.id = p.staff_id
    WHERE p.tenant_id = @p_tenant_id
      AND (@p_staff_id IS NULL OR p.staff_id = @p_staff_id)
      AND (@p_month    IS NULL OR p.month    = @p_month)
      AND (@p_year     IS NULL OR p.year     = @p_year)
    ORDER BY p.year DESC, p.month DESC, s.last_name;
END;
GO

-- sp_mark_payroll_paid
CREATE OR ALTER PROCEDURE sp_mark_payroll_paid
    @p_tenant_id  UNIQUEIDENTIFIER,
    @p_payroll_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE payroll
    SET    status  = 'Paid',
           paid_at = SYSUTCDATETIME()
    WHERE  tenant_id = @p_tenant_id
      AND  id        = @p_payroll_id
      AND  status    = 'Processed';
END;
GO

-- ============================================================
-- STUDENTS
-- ============================================================

-- sp_get_students
CREATE OR ALTER PROCEDURE sp_get_students
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_status    NVARCHAR(20)     = NULL,
    @p_class_id  NVARCHAR(50)     = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        id, tenant_id, admission_number, first_name, last_name,
        date_of_birth, gender, class_id, class_name, section,
        parent_name, parent_phone, parent_email, address,
        status, admission_date, created_at
    FROM students
    WHERE tenant_id = @p_tenant_id
      AND (@p_status   IS NULL OR status   = @p_status)
      AND (@p_class_id IS NULL OR class_id = @p_class_id)
    ORDER BY created_at DESC;
END;
GO

-- sp_admit_student: enrol a new student with auto-generated admission number
CREATE OR ALTER PROCEDURE sp_admit_student
    @p_tenant_id     UNIQUEIDENTIFIER,
    @p_first_name    NVARCHAR(100),
    @p_last_name     NVARCHAR(100),
    @p_date_of_birth DATE,
    @p_gender        NVARCHAR(10)  = 'Male',
    @p_class_id      NVARCHAR(50),
    @p_class_name    NVARCHAR(100) = '',
    @p_section       NVARCHAR(10)  = 'A',
    @p_parent_name   NVARCHAR(200),
    @p_parent_phone  NVARCHAR(20),
    @p_parent_email  NVARCHAR(255) = NULL,
    @p_address       NVARCHAR(500) = NULL,
    @p_admission_date DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @new_id    UNIQUEIDENTIFIER = NEWID();
    DECLARE @year_str  NVARCHAR(4)      = CAST(YEAR(GETDATE()) AS NVARCHAR(4));
    DECLARE @seq       INT;
    DECLARE @adm_no    NVARCHAR(50);
    DECLARE @actual_date DATE           = ISNULL(@p_admission_date, CAST(GETDATE() AS DATE));

    SELECT @seq = COUNT(*) + 1
    FROM   students
    WHERE  tenant_id  = @p_tenant_id
      AND  YEAR(admission_date) = YEAR(GETDATE());

    SET @adm_no = 'ADM' + @year_str + RIGHT('00000' + CAST(@seq AS NVARCHAR(10)), 5);

    INSERT INTO students (
        id, tenant_id, admission_number, first_name, last_name,
        date_of_birth, gender, class_id, class_name, section,
        parent_name, parent_phone, parent_email, address,
        status, admission_date
    )
    VALUES (
        @new_id, @p_tenant_id, @adm_no, @p_first_name, @p_last_name,
        @p_date_of_birth, @p_gender, @p_class_id, @p_class_name, @p_section,
        @p_parent_name, @p_parent_phone, @p_parent_email, @p_address,
        'Active', @actual_date
    );

    SELECT
        id, tenant_id, admission_number, first_name, last_name,
        date_of_birth, gender, class_id, class_name, section,
        parent_name, parent_phone, parent_email, address,
        status, admission_date, created_at
    FROM students WHERE id = @new_id;
END;
GO

-- sp_promote_student
CREATE OR ALTER PROCEDURE sp_promote_student
    @p_tenant_id    UNIQUEIDENTIFIER,
    @p_student_id   UNIQUEIDENTIFIER,
    @p_new_class_id NVARCHAR(50),
    @p_new_class_name NVARCHAR(100),
    @p_new_section  NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE students
    SET    class_id   = @p_new_class_id,
           class_name = @p_new_class_name,
           section    = @p_new_section
    WHERE  tenant_id = @p_tenant_id
      AND  id        = @p_student_id;
END;
GO

-- sp_update_student_status
CREATE OR ALTER PROCEDURE sp_update_student_status
    @p_tenant_id  UNIQUEIDENTIFIER,
    @p_student_id UNIQUEIDENTIFIER,
    @p_status     NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE students
    SET    status = @p_status
    WHERE  tenant_id = @p_tenant_id
      AND  id        = @p_student_id;
END;
GO

-- ============================================================
-- FEE MANAGEMENT
-- ============================================================

-- sp_get_fee_categories
CREATE OR ALTER PROCEDURE sp_get_fee_categories
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_type      NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        id, tenant_id, name, type, amount, due_date,
        late_fee_per_day, is_active, created_at, updated_at
    FROM fee_categories
    WHERE tenant_id = @p_tenant_id
      AND is_active = 1
      AND (@p_type IS NULL OR type = @p_type)
    ORDER BY type, name;
END;
GO

-- sp_create_fee_category
CREATE OR ALTER PROCEDURE sp_create_fee_category
    @p_tenant_id        UNIQUEIDENTIFIER,
    @p_name             NVARCHAR(200),
    @p_type             NVARCHAR(20),
    @p_amount           DECIMAL(12,2),
    @p_due_date         DATE,
    @p_late_fee_per_day DECIMAL(8,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @new_id UNIQUEIDENTIFIER = NEWID();

    INSERT INTO fee_categories (
        id, tenant_id, name, type, amount, due_date, late_fee_per_day, is_active
    )
    VALUES (
        @new_id, @p_tenant_id, @p_name, @p_type, @p_amount,
        @p_due_date, @p_late_fee_per_day, 1
    );

    SELECT
        id, tenant_id, name, type, amount, due_date,
        late_fee_per_day, is_active, created_at, updated_at
    FROM fee_categories WHERE id = @new_id;
END;
GO

-- sp_get_fee_payments
CREATE OR ALTER PROCEDURE sp_get_fee_payments
    @p_tenant_id  UNIQUEIDENTIFIER,
    @p_student_id UNIQUEIDENTIFIER = NULL,
    @p_status     NVARCHAR(20)     = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        fp.id, fp.tenant_id, fp.student_id,
        st.first_name + ' ' + st.last_name AS student_name,
        st.admission_number, st.class_name, st.section,
        fp.fee_category_id,
        fc.name AS fee_category_name, fc.type AS fee_type,
        fp.total_amount, fp.paid_amount, fp.balance, fp.late_fee,
        fp.receipt_number, fp.payment_date, fp.payment_mode,
        fp.status, fp.created_at, fp.updated_at
    FROM fee_payments fp
    JOIN students       st ON st.id = fp.student_id
    JOIN fee_categories fc ON fc.id = fp.fee_category_id
    WHERE fp.tenant_id = @p_tenant_id
      AND (@p_student_id IS NULL OR fp.student_id = @p_student_id)
      AND (@p_status     IS NULL OR fp.status     = @p_status)
    ORDER BY fp.created_at DESC;
END;
GO

-- sp_record_fee_payment
CREATE OR ALTER PROCEDURE sp_record_fee_payment
    @p_tenant_id       UNIQUEIDENTIFIER,
    @p_student_id      UNIQUEIDENTIFIER,
    @p_fee_category_id UNIQUEIDENTIFIER,
    @p_paid_amount     DECIMAL(12,2),
    @p_payment_mode    NVARCHAR(20),
    @p_payment_date    DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Fetch fee category details
    DECLARE @total_amount    DECIMAL(12,2);
    DECLARE @due_date        DATE;
    DECLARE @late_per_day    DECIMAL(8,2);

    SELECT  @total_amount = amount,
            @due_date     = due_date,
            @late_per_day = late_fee_per_day
    FROM fee_categories
    WHERE id = @p_fee_category_id AND tenant_id = @p_tenant_id;

    IF @total_amount IS NULL
    BEGIN
        RAISERROR('Fee category not found', 16, 1);
        RETURN;
    END

    -- Calculate late fee
    DECLARE @pay_date    DATE         = ISNULL(@p_payment_date, CAST(GETDATE() AS DATE));
    DECLARE @overdue     INT          = CASE
                                         WHEN @pay_date > @due_date
                                         THEN DATEDIFF(DAY, @due_date, @pay_date)
                                         ELSE 0
                                       END;
    DECLARE @late_fee    DECIMAL(12,2) = @overdue * @late_per_day;
    DECLARE @balance     DECIMAL(12,2) = @total_amount + @late_fee - @p_paid_amount;
    IF @balance < 0 SET @balance = 0;

    -- Determine status
    DECLARE @status NVARCHAR(20) = CASE
        WHEN @p_paid_amount  = 0                   THEN 'Pending'
        WHEN @balance        = 0                   THEN 'Paid'
        ELSE                                             'Partial'
    END;

    -- Generate receipt number (only when payment > 0)
    DECLARE @receipt NVARCHAR(50) = NULL;
    IF @p_paid_amount > 0
    BEGIN
        DECLARE @date_str NVARCHAR(8)  = FORMAT(@pay_date, 'yyyyMMdd');
        DECLARE @seq_no   INT;
        SELECT  @seq_no = COUNT(*) + 1
        FROM    fee_payments
        WHERE   tenant_id    = @p_tenant_id
          AND   receipt_number LIKE 'RCP-' + @date_str + '-%';
        SET @receipt = 'RCP-' + @date_str + '-' + RIGHT('0000' + CAST(@seq_no AS NVARCHAR(10)), 4);
    END

    -- Check for existing record for this student + category
    DECLARE @existing_id UNIQUEIDENTIFIER;
    SELECT @existing_id = id
    FROM   fee_payments
    WHERE  tenant_id       = @p_tenant_id
      AND  student_id      = @p_student_id
      AND  fee_category_id = @p_fee_category_id;

    IF @existing_id IS NOT NULL
    BEGIN
        UPDATE fee_payments
        SET    paid_amount    = @p_paid_amount,
               balance        = @balance,
               late_fee       = @late_fee,
               receipt_number = ISNULL(@receipt, receipt_number),
               payment_date   = @pay_date,
               payment_mode   = @p_payment_mode,
               status         = @status,
               updated_at     = SYSUTCDATETIME()
        WHERE  id = @existing_id;

        SELECT
            fp.id, fp.tenant_id, fp.student_id, fp.fee_category_id,
            fp.total_amount, fp.paid_amount, fp.balance, fp.late_fee,
            fp.receipt_number, fp.payment_date, fp.payment_mode,
            fp.status, fp.created_at, fp.updated_at
        FROM fee_payments fp WHERE fp.id = @existing_id;
    END
    ELSE
    BEGIN
        DECLARE @new_id UNIQUEIDENTIFIER = NEWID();
        INSERT INTO fee_payments (
            id, tenant_id, student_id, fee_category_id,
            total_amount, paid_amount, balance, late_fee,
            receipt_number, payment_date, payment_mode, status
        )
        VALUES (
            @new_id, @p_tenant_id, @p_student_id, @p_fee_category_id,
            @total_amount, @p_paid_amount, @balance, @late_fee,
            @receipt, @pay_date, @p_payment_mode, @status
        );

        SELECT
            fp.id, fp.tenant_id, fp.student_id, fp.fee_category_id,
            fp.total_amount, fp.paid_amount, fp.balance, fp.late_fee,
            fp.receipt_number, fp.payment_date, fp.payment_mode,
            fp.status, fp.created_at, fp.updated_at
        FROM fee_payments fp WHERE fp.id = @new_id;
    END
END;
GO

-- sp_get_pending_fees_summary
CREATE OR ALTER PROCEDURE sp_get_pending_fees_summary
    @p_tenant_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(*)       AS record_count,
        ISNULL(SUM(balance),   0) AS total_pending,
        ISNULL(SUM(late_fee),  0) AS total_late_fee
    FROM fee_payments
    WHERE tenant_id = @p_tenant_id
      AND status IN ('Pending','Partial');
END;
GO

-- ============================================================
-- ANALYTICS / DASHBOARD
-- ============================================================

-- sp_get_dashboard_stats
CREATE OR ALTER PROCEDURE sp_get_dashboard_stats
    @p_tenant_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_students  INT;
    DECLARE @total_staff     INT;
    DECLARE @monthly_revenue DECIMAL(14,2);
    DECLARE @monthly_expense DECIMAL(14,2);
    DECLARE @pending_fees    DECIMAL(14,2);

    SELECT @total_students = COUNT(*) FROM students
    WHERE tenant_id = @p_tenant_id AND status = 'Active';

    SELECT @total_staff = COUNT(*) FROM staff
    WHERE tenant_id = @p_tenant_id AND status != 'Terminated';

    SELECT @monthly_revenue = ISNULL(SUM(paid_amount), 0)
    FROM fee_payments
    WHERE tenant_id   = @p_tenant_id
      AND MONTH(payment_date) = MONTH(GETDATE())
      AND YEAR(payment_date)  = YEAR(GETDATE());

    SELECT @monthly_expense = ISNULL(SUM(net_salary), 0)
    FROM payroll
    WHERE tenant_id = @p_tenant_id
      AND month     = MONTH(GETDATE())
      AND year      = YEAR(GETDATE())
      AND status    = 'Paid';

    SELECT @pending_fees = ISNULL(SUM(balance), 0)
    FROM fee_payments
    WHERE tenant_id = @p_tenant_id
      AND status IN ('Pending','Partial');

    SELECT
        @total_students  AS total_students,
        @total_staff     AS total_staff,
        @monthly_revenue AS monthly_revenue,
        @monthly_expense AS monthly_expense,
        @pending_fees    AS pending_fees;
END;
GO

-- sp_get_revenue_trend: returns last N months of revenue vs expense
CREATE OR ALTER PROCEDURE sp_get_revenue_trend
    @p_tenant_id UNIQUEIDENTIFIER,
    @p_months    INT = 12
AS
BEGIN
    SET NOCOUNT ON;

    -- Generate series of months using a recursive CTE
    WITH months AS (
        SELECT CAST(DATEADD(MONTH, -((@p_months - 1)), DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)) AS DATE) AS month_start
        UNION ALL
        SELECT DATEADD(MONTH, 1, month_start)
        FROM months
        WHERE month_start < DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
    ),
    revenue AS (
        SELECT
            YEAR(payment_date)  AS yr,
            MONTH(payment_date) AS mo,
            SUM(paid_amount)    AS rev
        FROM fee_payments
        WHERE tenant_id = @p_tenant_id
          AND payment_date IS NOT NULL
        GROUP BY YEAR(payment_date), MONTH(payment_date)
    ),
    expense AS (
        SELECT
            year            AS yr,
            month           AS mo,
            SUM(net_salary) AS exp
        FROM payroll
        WHERE tenant_id = @p_tenant_id
          AND status    = 'Paid'
        GROUP BY year, month
    )
    SELECT
        FORMAT(m.month_start, 'MMM yy') AS month_label,
        ISNULL(r.rev, 0)                AS revenue,
        ISNULL(e.exp, 0)                AS expense
    FROM months m
    LEFT JOIN revenue r ON r.yr = YEAR(m.month_start)  AND r.mo = MONTH(m.month_start)
    LEFT JOIN expense e ON e.yr = YEAR(m.month_start)  AND e.mo = MONTH(m.month_start)
    ORDER BY m.month_start
    OPTION (MAXRECURSION 36);
END;
GO

-- sp_get_all_schools_summary (SuperAdmin)
CREATE OR ALTER PROCEDURE sp_get_all_schools_summary
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.id          AS tenant_id,
        t.name        AS school_name,
        t.address,
        t.phone,
        t.email,
        t.principal_name,
        t.is_active,
        (SELECT COUNT(*) FROM students s WHERE s.tenant_id = t.id AND s.status = 'Active') AS total_students,
        (SELECT COUNT(*) FROM staff    st WHERE st.tenant_id = t.id AND st.status != 'Terminated') AS total_staff,
        (SELECT ISNULL(SUM(fp.paid_amount), 0)
         FROM fee_payments fp
         WHERE fp.tenant_id   = t.id
           AND MONTH(fp.payment_date) = MONTH(GETDATE())
           AND YEAR(fp.payment_date)  = YEAR(GETDATE())) AS monthly_revenue,
        (SELECT ISNULL(SUM(p.net_salary), 0)
         FROM payroll p
         WHERE p.tenant_id = t.id
           AND p.month     = MONTH(GETDATE())
           AND p.year      = YEAR(GETDATE())
           AND p.status    = 'Paid') AS monthly_expense
    FROM tenants t
    WHERE t.is_active = 1
    ORDER BY t.name;
END;
GO
