import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Payroll, Staff } from '@/types';
import { calculatePayroll } from '@/lib/payroll';
import { getSession } from '@/lib/auth';

const mockStaff: Staff[] = [
  {
    id: '1',
    tenantId: 'school1',
    employeeCode: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@school.com',
    phone: '9876543210',
    department: 'Mathematics',
    designation: 'Senior Teacher',
    status: 'Active',
    joinDate: '2020-01-15',
    basicSalary: 50000,
    createdAt: '2020-01-15',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    tenantId: 'school1',
    employeeCode: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@school.com',
    phone: '9876543211',
    department: 'Science',
    designation: 'Teacher',
    status: 'On-Leave',
    joinDate: '2021-06-01',
    basicSalary: 45000,
    createdAt: '2021-06-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    tenantId: 'school1',
    employeeCode: 'EMP003',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.c@school.com',
    phone: '9876543212',
    department: 'English',
    designation: 'Teacher',
    status: 'Active',
    joinDate: '2019-08-01',
    basicSalary: 48000,
    createdAt: '2019-08-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '4',
    tenantId: 'school1',
    employeeCode: 'EMP004',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.s@school.com',
    phone: '9876543213',
    department: 'Administration',
    designation: 'Principal',
    status: 'Active',
    joinDate: '2015-04-01',
    basicSalary: 80000,
    createdAt: '2015-04-01',
    updatedAt: '2024-01-01',
  },
];

const mockPayrolls: Payroll[] = [
  {
    id: 'pay1',
    tenantId: 'school1',
    staffId: '1',
    month: 12,
    year: 2024,
    basicSalary: 50000,
    hra: 20000,
    da: 7500,
    pf: 6000,
    lopDays: 0,
    lopAmount: 0,
    grossSalary: 77500,
    netSalary: 71500,
    status: 'Paid',
    processedAt: '2024-12-31T10:00:00.000Z',
  },
  {
    id: 'pay2',
    tenantId: 'school1',
    staffId: '2',
    month: 12,
    year: 2024,
    basicSalary: 45000,
    hra: 18000,
    da: 6750,
    pf: 5400,
    lopDays: 3,
    lopAmount: 5192.31,
    grossSalary: 69750,
    netSalary: 59157.69,
    status: 'Processed',
    processedAt: '2024-12-31T10:00:00.000Z',
  },
];

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const tenantPayrolls = mockPayrolls.filter((p) => p.tenantId === session.tenantId);
    return NextResponse.json<ApiResponse<Payroll[]>>({ success: true, data: tenantPayrolls });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = (await request.json()) as {
      staffId?: string;
      month?: number;
      year?: number;
      lopDays?: number;
    };
    const { staffId, month, year, lopDays = 0 } = body;

    if (!staffId || !month || !year) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'staffId, month, and year are required' },
        { status: 400 }
      );
    }

    const staff = mockStaff.find((s) => s.id === staffId && s.tenantId === session.tenantId);
    if (!staff) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    const payrollData = calculatePayroll(staff, month, year, lopDays);
    const newPayroll: Payroll = {
      ...payrollData,
      id: Date.now().toString(),
      status: 'Processed',
      processedAt: new Date().toISOString(),
    };
    mockPayrolls.push(newPayroll);

    return NextResponse.json<ApiResponse<Payroll>>(
      { success: true, data: newPayroll, message: 'Payroll processed' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
