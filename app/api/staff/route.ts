import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Staff } from '@/types';
import { validateStaff } from '@/lib/validation';
import { getSession } from '@/lib/auth';

// Mock data for demo (replace with DB queries using lib/db.ts in production)
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
  {
    id: '5',
    tenantId: 'school1',
    employeeCode: 'EMP005',
    firstName: 'Robert',
    lastName: 'Williams',
    email: 'robert.w@school.com',
    phone: '9876543214',
    department: 'Physical Education',
    designation: 'Sports Coach',
    status: 'Terminated',
    joinDate: '2018-07-15',
    basicSalary: 38000,
    createdAt: '2018-07-15',
    updatedAt: '2023-12-31',
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
    const tenantStaff = mockStaff.filter((s) => s.tenantId === session.tenantId);
    return NextResponse.json<ApiResponse<Staff[]>>({ success: true, data: tenantStaff });
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
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateStaff(body);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Validation failed',
          message: JSON.stringify(validation.errors),
        },
        { status: 400 }
      );
    }
    const newStaff: Staff = {
      id: Date.now().toString(),
      tenantId: session.tenantId,
      employeeCode: `EMP${Date.now()}`,
      firstName: body.firstName as string,
      lastName: body.lastName as string,
      email: body.email as string,
      phone: (body.phone as string) || '',
      department: body.department as string,
      designation: body.designation as string,
      status: 'Active',
      joinDate: new Date().toISOString().slice(0, 10),
      basicSalary: Number(body.basicSalary),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStaff.push(newStaff);
    return NextResponse.json<ApiResponse<Staff>>(
      { success: true, data: newStaff, message: 'Staff created successfully' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
