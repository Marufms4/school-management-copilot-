import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Staff } from '@/types';
import { validateStaff } from '@/lib/validation';
import { getSession } from '@/lib/auth';
import { callProc, callProcOne, pgDateToString } from '@/lib/db';

// ---------------------------------------------------------------------------
// DB row → Staff interface mapper
// (PostgreSQL snake_case → TypeScript camelCase)
// ---------------------------------------------------------------------------
function mapRow(row: Record<string, unknown>): Staff {
  return {
    id:            row.id as string,
    tenantId:      row.tenant_id as string,
    employeeCode:  row.employee_code as string,
    firstName:     row.first_name as string,
    lastName:      row.last_name as string,
    email:         row.email as string,
    phone:         (row.phone as string) ?? '',
    department:    row.department as string,
    designation:   row.designation as string,
    status:        row.status as Staff['status'],
    joinDate:      pgDateToString(row.join_date),
    basicSalary:   Number(row.basic_salary),
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // sp_get_staff(p_tenant_id, p_status)
    const rows = await callProc<Record<string, unknown>>(
      'sp_get_staff',
      [session.tenantId, null]
    );
    const staff = rows.map(mapRow);
    return NextResponse.json<ApiResponse<Staff[]>>({ success: true, data: staff });
  } catch (err) {
    console.error('[GET /api/staff]', err);
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

    // sp_create_staff(tenant_id, first_name, last_name, email, phone,
    //                 department, designation, basic_salary, join_date)
    const row = await callProcOne<Record<string, unknown>>('sp_create_staff', [
      session.tenantId,
      body.firstName,
      body.lastName,
      body.email,
      body.phone ?? '',
      body.department,
      body.designation,
      Number(body.basicSalary),
      body.joinDate ?? null,
    ]);

    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to create staff record' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Staff>>(
      { success: true, data: mapRow(row), message: 'Staff created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/staff]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
