-- ============================================================
-- EduCore SaaS – Seed Data (development / demo)
-- Password hash below = bcrypt('demo123', 10) – change in prod
-- ============================================================

-- Tenants
INSERT INTO tenants (id, name, address, phone, email, principal_name) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'EduCore Demo School', '123 Education Lane, Mumbai', '022-12345678',
   'admin@democschool.edu', 'Dr. Anita Sharma')
ON CONFLICT DO NOTHING;

-- Users (SuperAdmin + SchoolAdmin for demo)
INSERT INTO users (id, tenant_id, email, password_hash, name, role) VALUES
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'admin@democschool.edu',
   '$2b$10$EJHtJDYBMKxe9G.qXJkmFuScvbOtNKfn1R.Y.3LxaQ6GEiYxH3kqC',
   'Dr. Anita Sharma', 'SchoolAdmin'),
  ('10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'staff@democschool.edu',
   '$2b$10$EJHtJDYBMKxe9G.qXJkmFuScvbOtNKfn1R.Y.3LxaQ6GEiYxH3kqC',
   'John Smith', 'Staff')
ON CONFLICT DO NOTHING;

-- Staff
INSERT INTO staff (id, tenant_id, employee_code, first_name, last_name, email,
                   phone, department, designation, basic_salary, join_date) VALUES
  ('20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'EMP20240001', 'John', 'Smith', 'john.smith@democschool.edu',
   '9876543210', 'Mathematics', 'Senior Teacher', 50000, '2020-01-15'),
  ('20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'EMP20240002', 'Sarah', 'Johnson', 'sarah.j@democschool.edu',
   '9876543211', 'Science', 'Teacher', 45000, '2021-06-01'),
  ('20000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'EMP20240003', 'Priya', 'Sharma', 'priya.s@democschool.edu',
   '9876543213', 'Administration', 'Principal', 80000, '2015-04-01')
ON CONFLICT DO NOTHING;

UPDATE staff SET status = 'On-Leave'
WHERE id = '20000000-0000-0000-0000-000000000002';

-- Students
INSERT INTO students (id, tenant_id, admission_number, first_name, last_name,
                      date_of_birth, gender, class_id, class_name, section,
                      parent_name, parent_phone, parent_email, address, admission_date) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'ADM20240001', 'Arjun', 'Patel', '2010-05-15', 'Male',
   'class8a', 'Class 8', 'A', 'Rajesh Patel', '9876512345',
   'rajesh.patel@email.com', '123, Park Street, Mumbai', '2024-06-01'),
  ('30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'ADM20240002', 'Ananya', 'Singh', '2011-08-22', 'Female',
   'class7b', 'Class 7', 'B', 'Vikram Singh', '9876512346',
   'vikram.singh@email.com', '456, Lake Road, Mumbai', '2024-06-01'),
  ('30000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'ADM20240003', 'Rohan', 'Mehta', '2009-11-10', 'Male',
   'class9c', 'Class 9', 'C', 'Suresh Mehta', '9876512347',
   'suresh.mehta@email.com', '789, Hill Avenue, Mumbai', '2023-06-01')
ON CONFLICT DO NOTHING;

-- Fee Categories
INSERT INTO fee_categories (id, tenant_id, name, type, amount, due_date, late_fee_per_day) VALUES
  ('40000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Annual Tuition Fee', 'Tuition', 45000, '2024-04-15', 50),
  ('40000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Transport Fee', 'Transport', 12000, '2024-04-15', 20),
  ('40000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Exam Fee', 'Exams', 2500, '2024-10-01', 10)
ON CONFLICT DO NOTHING;
