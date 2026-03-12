// Core API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// All models must include tenantId

export interface Staff {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: 'Active' | 'On-Leave' | 'Terminated';
  joinDate: string;
  basicSalary: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryComponent {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  baseRef?: 'basic';
}

export interface Payroll {
  id: string;
  tenantId: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  da: number;
  pf: number;
  lopDays: number;
  lopAmount: number;
  grossSalary: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Paid';
  processedAt?: string;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  staffId: string;
  leaveType: 'Casual' | 'Sick' | 'Annual';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface Student {
  id: string;
  tenantId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  classId: string;
  className: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  status: 'Active' | 'Graduated' | 'Withdrawn';
  admissionDate: string;
  createdAt: string;
}

export interface FeeCategory {
  id: string;
  tenantId: string;
  name: string;
  type: 'Tuition' | 'Transport' | 'Exams' | 'Other';
  amount: number;
  dueDate: string;
  lateFeePerDay: number;
}

export interface FeePayment {
  id: string;
  tenantId: string;
  studentId: string;
  feeCategoryId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  lateFee: number;
  receiptNumber: string;
  paymentDate: string;
  paymentMode: 'Cash' | 'Online' | 'Cheque';
  status: 'Pending' | 'Partial' | 'Paid';
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  totalStudents: number;
  totalStaff: number;
  monthlyRevenue: number;
  monthlyExpense: number;
}

export interface DashboardStats {
  tenantId: string;
  totalStudents: number;
  totalStaff: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  pendingFees: number;
  revenueData: { month: string; revenue: number; expense: number }[];
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: 'SuperAdmin' | 'SchoolAdmin' | 'Staff' | 'Student';
  name: string;
}
