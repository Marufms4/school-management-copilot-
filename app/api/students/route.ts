import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Student } from '@/types';
import { validateStudent } from '@/lib/validation';
import { getSession } from '@/lib/auth';

const mockStudents: Student[] = [
  {
    id: '1',
    tenantId: 'school1',
    admissionNumber: 'ADM2024001',
    firstName: 'Arjun',
    lastName: 'Patel',
    dateOfBirth: '2010-05-15',
    gender: 'Male',
    classId: 'class8a',
    className: 'Class 8',
    section: 'A',
    parentName: 'Rajesh Patel',
    parentPhone: '9876512345',
    parentEmail: 'rajesh.patel@email.com',
    address: '123, Park Street, Mumbai',
    status: 'Active',
    admissionDate: '2024-06-01',
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    tenantId: 'school1',
    admissionNumber: 'ADM2024002',
    firstName: 'Ananya',
    lastName: 'Singh',
    dateOfBirth: '2011-08-22',
    gender: 'Female',
    classId: 'class7b',
    className: 'Class 7',
    section: 'B',
    parentName: 'Vikram Singh',
    parentPhone: '9876512346',
    parentEmail: 'vikram.singh@email.com',
    address: '456, Lake Road, Mumbai',
    status: 'Active',
    admissionDate: '2024-06-01',
    createdAt: '2024-06-01',
  },
  {
    id: '3',
    tenantId: 'school1',
    admissionNumber: 'ADM2024003',
    firstName: 'Rohan',
    lastName: 'Mehta',
    dateOfBirth: '2009-11-10',
    gender: 'Male',
    classId: 'class9c',
    className: 'Class 9',
    section: 'C',
    parentName: 'Suresh Mehta',
    parentPhone: '9876512347',
    parentEmail: 'suresh.mehta@email.com',
    address: '789, Hill Avenue, Mumbai',
    status: 'Active',
    admissionDate: '2023-06-01',
    createdAt: '2023-06-01',
  },
  {
    id: '4',
    tenantId: 'school1',
    admissionNumber: 'ADM2023001',
    firstName: 'Sneha',
    lastName: 'Kumar',
    dateOfBirth: '2008-03-18',
    gender: 'Female',
    classId: 'class10a',
    className: 'Class 10',
    section: 'A',
    parentName: 'Anil Kumar',
    parentPhone: '9876512348',
    parentEmail: 'anil.kumar@email.com',
    address: '321, River View, Pune',
    status: 'Active',
    admissionDate: '2022-06-01',
    createdAt: '2022-06-01',
  },
  {
    id: '5',
    tenantId: 'school1',
    admissionNumber: 'ADM2022001',
    firstName: 'Karan',
    lastName: 'Gupta',
    dateOfBirth: '2007-07-25',
    gender: 'Male',
    classId: 'class11sci',
    className: 'Class 11',
    section: 'Science',
    parentName: 'Mohan Gupta',
    parentPhone: '9876512349',
    parentEmail: 'mohan.gupta@email.com',
    address: '654, Garden Colony, Pune',
    status: 'Active',
    admissionDate: '2021-06-01',
    createdAt: '2021-06-01',
  },
  {
    id: '6',
    tenantId: 'school1',
    admissionNumber: 'ADM2020001',
    firstName: 'Divya',
    lastName: 'Nair',
    dateOfBirth: '2006-01-30',
    gender: 'Female',
    classId: 'class12arts',
    className: 'Class 12',
    section: 'Arts',
    parentName: 'Sunil Nair',
    parentPhone: '9876512350',
    parentEmail: 'sunil.nair@email.com',
    address: '987, Sea View, Chennai',
    status: 'Graduated',
    admissionDate: '2020-06-01',
    createdAt: '2020-06-01',
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
    const tenantStudents = mockStudents.filter((s) => s.tenantId === session.tenantId);
    return NextResponse.json<ApiResponse<Student[]>>({ success: true, data: tenantStudents });
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
    const validation = validateStudent(body);
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
    const newStudent: Student = {
      id: Date.now().toString(),
      tenantId: session.tenantId,
      admissionNumber: `ADM${Date.now()}`,
      firstName: body.firstName as string,
      lastName: body.lastName as string,
      dateOfBirth: body.dateOfBirth as string,
      gender: (body.gender as Student['gender']) || 'Male',
      classId: body.classId as string,
      className: (body.className as string) || '',
      section: (body.section as string) || 'A',
      parentName: body.parentName as string,
      parentPhone: body.parentPhone as string,
      parentEmail: (body.parentEmail as string) || '',
      address: (body.address as string) || '',
      status: 'Active',
      admissionDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    mockStudents.push(newStudent);
    return NextResponse.json<ApiResponse<Student>>(
      { success: true, data: newStudent, message: 'Student admitted successfully' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
