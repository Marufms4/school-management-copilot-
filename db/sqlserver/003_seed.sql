-- ============================================================
-- EduCore SaaS – SQL Server Seed Data (Development / Demo)
-- Run AFTER 001_schema.sql and 002_stored_procedures.sql
-- ============================================================

USE EduCoreSaaS;
GO

-- ============================================================
-- 1. TENANTS
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenant2 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenant3 UNIQUEIDENTIFIER = NEWID();

-- Save for re-use in this batch
CREATE TABLE #tenant_ids (tid UNIQUEIDENTIFIER, label NVARCHAR(50));
INSERT INTO #tenant_ids VALUES (@tenant1, 'demo'), (@tenant2, 'sunrise'), (@tenant3, 'greenfield');

INSERT INTO tenants (id, name, address, phone, email, principal_name, is_active)
VALUES
    (@tenant1, 'EduCore Demo School',       'Mumbai, Maharashtra',  '022-11112222', 'admin@democschool.edu',   'Dr. Meena Iyer',      1),
    (@tenant2, 'Sunrise International School', 'Pune, Maharashtra',   '020-33334444', 'admin@sunrise.edu',       'Dr. Priya Sharma',    1),
    (@tenant3, 'Greenfield Academy',         'Nashik, Maharashtra', '0253-5556666', 'admin@greenfield.edu',    'Mr. Arun Verma',      1);
GO

-- ============================================================
-- 2. USERS
-- Passwords are SHA-256 hash of "demo123"
-- In production use bcrypt; here we store sha256 for demo purposes
-- SHA-256("demo123") = '3b5b23adf70c437a51e5fe68db6dc3e32d75bfe6a06c5e2e50f0e3cbca76e71e'
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @tenant2 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'sunrise');
DECLARE @tenant3 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'greenfield');
DECLARE @pw_hash NVARCHAR(MAX) = '3b5b23adf70c437a51e5fe68db6dc3e32d75bfe6a06c5e2e50f0e3cbca76e71e';

INSERT INTO users (id, tenant_id, email, password_hash, name, role, is_active)
VALUES
    -- Demo school
    (NEWID(), @tenant1, 'admin@democschool.edu', @pw_hash, 'Admin User',        'SchoolAdmin', 1),
    (NEWID(), @tenant1, 'staff@democschool.edu', @pw_hash, 'Staff Member',      'Staff',       1),
    (NEWID(), @tenant1, 'super@educore.io',      @pw_hash, 'Super Admin',       'SuperAdmin',  1),
    -- Sunrise
    (NEWID(), @tenant2, 'admin@sunrise.edu',     @pw_hash, 'Sunrise Admin',     'SchoolAdmin', 1),
    -- Greenfield
    (NEWID(), @tenant3, 'admin@greenfield.edu',  @pw_hash, 'Greenfield Admin',  'SchoolAdmin', 1);
GO

-- ============================================================
-- 3. STAFF  (Demo school)
-- ============================================================
DECLARE @tenant1  UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @staff1   UNIQUEIDENTIFIER = NEWID();
DECLARE @staff2   UNIQUEIDENTIFIER = NEWID();
DECLARE @staff3   UNIQUEIDENTIFIER = NEWID();
DECLARE @staff4   UNIQUEIDENTIFIER = NEWID();
DECLARE @staff5   UNIQUEIDENTIFIER = NEWID();
DECLARE @staff6   UNIQUEIDENTIFIER = NEWID();
DECLARE @staff7   UNIQUEIDENTIFIER = NEWID();

CREATE TABLE #staff_ids (sid UNIQUEIDENTIFIER, label NVARCHAR(50));
INSERT INTO #staff_ids VALUES
    (@staff1,'s1'),(@staff2,'s2'),(@staff3,'s3'),(@staff4,'s4'),
    (@staff5,'s5'),(@staff6,'s6'),(@staff7,'s7');

INSERT INTO staff (id, tenant_id, employee_code, first_name, last_name, email, phone,
                   department, designation, status, join_date, basic_salary)
VALUES
    (@staff1, @tenant1, 'EMP20240001', 'John',      'Smith',    'john.smith@democschool.edu',    '9800000001', 'Mathematics',         'Senior Teacher',     'Active',    '2022-06-01', 55000.00),
    (@staff2, @tenant1, 'EMP20240002', 'Sarah',     'Johnson',  'sarah.j@democschool.edu',       '9800000002', 'Science',             'Lab Instructor',     'On-Leave',  '2021-08-15', 48000.00),
    (@staff3, @tenant1, 'EMP20240003', 'Priya',     'Sharma',   'priya.s@democschool.edu',       '9800000003', 'English',             'Head of Department', 'Active',    '2020-04-01', 62000.00),
    (@staff4, @tenant1, 'EMP20240004', 'Rahul',     'Verma',    'rahul.v@democschool.edu',       '9800000004', 'Administration',      'Admin Officer',      'Active',    '2023-01-10', 40000.00),
    (@staff5, @tenant1, 'EMP20240005', 'Anita',     'Desai',    'anita.d@democschool.edu',       '9800000005', 'Physical Education',  'Sports Coach',       'Active',    '2022-09-01', 38000.00),
    (@staff6, @tenant1, 'EMP20240006', 'Mohammed',  'Khan',     'mk@democschool.edu',            '9800000006', 'Mathematics',         'Teacher',            'Active',    '2023-07-01', 45000.00),
    (@staff7, @tenant1, 'EMP20240007', 'Sunita',    'Patil',    'sunita.p@democschool.edu',      '9800000007', 'Science',             'Teacher',            'Terminated','2019-06-01', 42000.00);
GO

-- ============================================================
-- 4. LEAVE REQUESTS  (Demo school)
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @staff2  UNIQUEIDENTIFIER = (SELECT sid FROM #staff_ids WHERE label = 's2');
DECLARE @staff1  UNIQUEIDENTIFIER = (SELECT sid FROM #staff_ids WHERE label = 's1');

INSERT INTO leave_requests (id, tenant_id, staff_id, leave_type, start_date, end_date, days, reason, status)
VALUES
    (NEWID(), @tenant1, @staff2, 'Sick',   '2025-03-01', '2025-03-07', 7,  'Medical treatment',      'Approved'),
    (NEWID(), @tenant1, @staff2, 'Casual', '2025-03-10', '2025-03-11', 2,  'Personal work',          'Approved'),
    (NEWID(), @tenant1, @staff1, 'Annual', '2025-04-14', '2025-04-19', 6,  'Family function',        'Pending'),
    (NEWID(), @tenant1, @staff1, 'Casual', '2025-02-05', '2025-02-05', 1,  'Medical appointment',    'Approved');
GO

-- ============================================================
-- 5. PAYROLL  (Demo school – processed for March 2025)
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');

-- Process payroll for all active staff for March 2025
EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's1'),
     @p_month = 3, @p_year = 2025, @p_lop_days = 0;

EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's2'),
     @p_month = 3, @p_year = 2025, @p_lop_days = 9;

EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's3'),
     @p_month = 3, @p_year = 2025, @p_lop_days = 0;

EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's4'),
     @p_month = 3, @p_year = 2025, @p_lop_days = 0;

EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's5'),
     @p_month = 3, @p_year = 2025, @p_lop_days = 0;

-- Mark first 3 as Paid
EXEC sp_mark_payroll_paid @p_tenant_id = @tenant1,
     @p_payroll_id = (SELECT id FROM payroll WHERE tenant_id = @tenant1AND staff_id = (SELECT sid FROM #staff_ids WHERE label='s1') AND month=3 AND year=2025);
EXEC sp_mark_payroll_paid @p_tenant_id = @tenant1,
     @p_payroll_id = (SELECT id FROM payroll WHERE tenant_id = @tenant1 AND staff_id = (SELECT sid FROM #staff_ids WHERE label='s2') AND month=3 AND year=2025);
EXEC sp_mark_payroll_paid @p_tenant_id = @tenant1,
     @p_payroll_id = (SELECT id FROM payroll WHERE tenant_id = @tenant1 AND staff_id = (SELECT sid FROM #staff_ids WHERE label='s3') AND month=3 AND year=2025);
GO

-- Process Feb 2025 payroll as well
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');

EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's1'),
     @p_month = 2, @p_year = 2025, @p_lop_days = 0;
EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's3'),
     @p_month = 2, @p_year = 2025, @p_lop_days = 0;
EXEC sp_process_payroll @p_tenant_id = @tenant1,
     @p_staff_id = (SELECT sid FROM #staff_ids WHERE label = 's4'),
     @p_month = 2, @p_year = 2025, @p_lop_days = 0;

-- Mark Feb as paid
EXEC sp_mark_payroll_paid @p_tenant_id = @tenant1,
     @p_payroll_id = (SELECT id FROM payroll WHERE tenant_id = @tenant1 AND staff_id = (SELECT sid FROM #staff_ids WHERE label='s1') AND month=2 AND year=2025);
EXEC sp_mark_payroll_paid @p_tenant_id = @tenant1,
     @p_payroll_id = (SELECT id FROM payroll WHERE tenant_id = @tenant1 AND staff_id = (SELECT sid FROM #staff_ids WHERE label='s3') AND month=2 AND year=2025);
GO

-- ============================================================
-- 6. STUDENTS  (Demo school)
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @stu1  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu2  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu3  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu4  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu5  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu6  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu7  UNIQUEIDENTIFIER = NEWID();
DECLARE @stu8  UNIQUEIDENTIFIER = NEWID();

CREATE TABLE #student_ids (sid UNIQUEIDENTIFIER, label NVARCHAR(10));
INSERT INTO #student_ids VALUES
    (@stu1,'st1'),(@stu2,'st2'),(@stu3,'st3'),(@stu4,'st4'),
    (@stu5,'st5'),(@stu6,'st6'),(@stu7,'st7'),(@stu8,'st8');

INSERT INTO students (id, tenant_id, admission_number, first_name, last_name,
    date_of_birth, gender, class_id, class_name, section,
    parent_name, parent_phone, parent_email, address, status, admission_date)
VALUES
    (@stu1, @tenant1, 'ADM2024000001', 'Arjun',    'Patel',    '2011-05-12', 'Male',   'class8',  'Class VIII',  'A', 'Ramesh Patel',    '9811111001', 'ramesh.p@gmail.com',  '12 MG Road, Mumbai',     'Active',    '2024-06-10'),
    (@stu2, @tenant1, 'ADM2024000002', 'Ananya',   'Singh',    '2012-09-23', 'Female', 'class7',  'Class VII',   'B', 'Vijay Singh',     '9811111002', 'vsingh@gmail.com',    '45 Park St, Mumbai',     'Active',    '2024-06-10'),
    (@stu3, @tenant1, 'ADM2024000003', 'Rohan',    'Mehta',    '2010-03-15', 'Male',   'class9',  'Class IX',    'C', 'Suresh Mehta',    '9811111003', 'smehta@gmail.com',    '78 Hill View, Mumbai',   'Active',    '2023-06-10'),
    (@stu4, @tenant1, 'ADM2024000004', 'Kavya',    'Reddy',    '2011-11-30', 'Female', 'class8',  'Class VIII',  'A', 'Ravi Reddy',      '9811111004', 'rreddy@gmail.com',    '23 Linking Rd, Mumbai',  'Active',    '2024-06-10'),
    (@stu5, @tenant1, 'ADM2024000005', 'Aditya',   'Kumar',    '2013-07-08', 'Male',   'class6',  'Class VI',    'A', 'Santosh Kumar',   '9811111005', 'sk@gmail.com',        '56 Juhu Beach, Mumbai',  'Active',    '2024-06-10'),
    (@stu6, @tenant1, 'ADM2024000006', 'Shreya',   'Nair',     '2010-12-01', 'Female', 'class9',  'Class IX',    'B', 'Mohan Nair',      '9811111006', 'mnair@gmail.com',     '89 Bandra, Mumbai',      'Active',    '2023-06-10'),
    (@stu7, @tenant1, 'ADM2024000007', 'Vikram',   'Joshi',    '2009-04-17', 'Male',   'class10', 'Class X',     'A', 'Deepak Joshi',    '9811111007', 'djoshi@gmail.com',    '34 Andheri, Mumbai',     'Graduated', '2022-06-10'),
    (@stu8, @tenant1, 'ADM2024000008', 'Pooja',    'Gupta',    '2014-02-28', 'Female', 'class5',  'Class V',     'B', 'Ashok Gupta',     '9811111008', 'agupta@gmail.com',    '67 Powai, Mumbai',       'Active',    '2024-06-10');
GO

-- ============================================================
-- 7. FEE CATEGORIES  (Demo school)
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @fc1 UNIQUEIDENTIFIER = NEWID();
DECLARE @fc2 UNIQUEIDENTIFIER = NEWID();
DECLARE @fc3 UNIQUEIDENTIFIER = NEWID();
DECLARE @fc4 UNIQUEIDENTIFIER = NEWID();

CREATE TABLE #fee_cat_ids (fid UNIQUEIDENTIFIER, label NVARCHAR(10));
INSERT INTO #fee_cat_ids VALUES (@fc1,'fc1'),(@fc2,'fc2'),(@fc3,'fc3'),(@fc4,'fc4');

INSERT INTO fee_categories (id, tenant_id, name, type, amount, due_date, late_fee_per_day, is_active)
VALUES
    (@fc1, @tenant1, 'Annual Tuition Fee',  'Tuition',   45000.00, '2025-04-30', 50.00, 1),
    (@fc2, @tenant1, 'Transport Fee',       'Transport', 12000.00, '2025-04-30', 20.00, 1),
    (@fc3, @tenant1, 'Examination Fee',     'Exams',      2500.00, '2025-03-15', 10.00, 1),
    (@fc4, @tenant1, 'Activity Fund',       'Other',      3000.00, '2025-04-15',  5.00, 1);
GO

-- ============================================================
-- 8. FEE PAYMENTS  (Demo school – various states)
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @stu1 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st1');
DECLARE @stu2 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st2');
DECLARE @stu3 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st3');
DECLARE @stu4 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st4');
DECLARE @stu5 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st5');
DECLARE @fc1  UNIQUEIDENTIFIER = (SELECT fid FROM #fee_cat_ids WHERE label = 'fc1');
DECLARE @fc2  UNIQUEIDENTIFIER = (SELECT fid FROM #fee_cat_ids WHERE label = 'fc2');
DECLARE @fc3  UNIQUEIDENTIFIER = (SELECT fid FROM #fee_cat_ids WHERE label = 'fc3');

-- Arjun Patel – Tuition paid in full
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu1,
    @p_fee_category_id = @fc1, @p_paid_amount = 45000.00,
    @p_payment_mode = 'Online', @p_payment_date = '2025-03-10';

-- Arjun Patel – Transport paid
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu1,
    @p_fee_category_id = @fc2, @p_paid_amount = 12000.00,
    @p_payment_mode = 'Online', @p_payment_date = '2025-03-10';

-- Ananya Singh – Tuition partially paid
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu2,
    @p_fee_category_id = @fc1, @p_paid_amount = 22500.00,
    @p_payment_mode = 'Cash', @p_payment_date = '2025-03-05';

-- Rohan Mehta – Exam fee paid
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu3,
    @p_fee_category_id = @fc3, @p_paid_amount = 2500.00,
    @p_payment_mode = 'Cheque', @p_payment_date = '2025-03-08';

-- Rohan Mehta – Tuition full
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu3,
    @p_fee_category_id = @fc1, @p_paid_amount = 45000.00,
    @p_payment_mode = 'Online', @p_payment_date = '2025-03-08';

-- Kavya Reddy – Tuition pending (no payment)
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu4,
    @p_fee_category_id = @fc1, @p_paid_amount = 0,
    @p_payment_mode = 'Cash', @p_payment_date = NULL;

-- Aditya Kumar – Exam fee paid
EXEC sp_record_fee_payment
    @p_tenant_id = @tenant1, @p_student_id = @stu5,
    @p_fee_category_id = @fc3, @p_paid_amount = 2500.00,
    @p_payment_mode = 'Online', @p_payment_date = '2025-03-12';
GO

-- ============================================================
-- 9. HISTORICAL FEE PAYMENTS (Jan & Feb 2025 for revenue trend)
-- ============================================================
DECLARE @tenant1 UNIQUEIDENTIFIER = (SELECT tid FROM #tenant_ids WHERE label = 'demo');
DECLARE @stu1 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st1');
DECLARE @stu2 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st2');
DECLARE @stu6 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st6');
DECLARE @stu8 UNIQUEIDENTIFIER = (SELECT sid FROM #student_ids WHERE label = 'st8');
DECLARE @fc2  UNIQUEIDENTIFIER = (SELECT fid FROM #fee_cat_ids WHERE label = 'fc2');
DECLARE @fc4  UNIQUEIDENTIFIER = (SELECT fid FROM #fee_cat_ids WHERE label = 'fc4');

-- Jan payments
INSERT INTO fee_payments (id, tenant_id, student_id, fee_category_id,
    total_amount, paid_amount, balance, late_fee, receipt_number,
    payment_date, payment_mode, status)
VALUES
    (NEWID(), @tenant1, @stu6, @fc2, 12000.00, 12000.00, 0.00, 0.00, 'RCP-20250115-0001', '2025-01-15', 'Online', 'Paid'),
    (NEWID(), @tenant1, @stu8, @fc4,  3000.00,  3000.00, 0.00, 0.00, 'RCP-20250118-0001', '2025-01-18', 'Cash',   'Paid'),
    (NEWID(), @tenant1, @stu2, @fc2, 12000.00,  6000.00, 6000.00, 0.00, 'RCP-20250120-0001', '2025-01-20', 'Cash', 'Partial');

-- Feb payments
INSERT INTO fee_payments (id, tenant_id, student_id, fee_category_id,
    total_amount, paid_amount, balance, late_fee, receipt_number,
    payment_date, payment_mode, status)
VALUES
    (NEWID(), @tenant1, @stu1, @fc4, 3000.00, 3000.00, 0.00, 0.00, 'RCP-20250210-0001', '2025-02-10', 'Online', 'Paid'),
    (NEWID(), @tenant1, @stu8, @fc2, 12000.00, 12000.00, 0.00, 0.00, 'RCP-20250214-0001', '2025-02-14', 'Online', 'Paid');
GO

-- ============================================================
-- Cleanup temp tables
-- ============================================================
DROP TABLE IF EXISTS #tenant_ids;
DROP TABLE IF EXISTS #staff_ids;
DROP TABLE IF EXISTS #student_ids;
DROP TABLE IF EXISTS #fee_cat_ids;
GO

PRINT 'Seed data inserted successfully.';
GO
