import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Student } from '@/types';
import { validateStudent } from '@/lib/validation';
import { getSession } from '@/lib/auth';
import { callProc, callProcOne, pgDateToString } from '@/lib/db';

// ---------------------------------------------------------------------------
// DB row → Student mapper
// ---------------------------------------------------------------------------
function mapRow(row: Record<string, unknown>): Student {
  return {
    id:              row.id as string,
    tenantId:        row.tenant_id as string,
    admissionNumber: row.admission_number as string,
    firstName:       row.first_name as string,
    lastName:        row.last_name as string,
    dateOfBirth:     pgDateToString(row.date_of_birth),
    gender:          row.gender as Student['gender'],
    classId:         row.class_id as string,
    className:       row.class_name as string,
    section:         row.section as string,
    parentName:      row.parent_name as string,
    parentPhone:     row.parent_phone as string,
    parentEmail:     (row.parent_email as string) ?? '',
    address:         (row.address as string) ?? '',
    status:          row.status as Student['status'],
    admissionDate:   pgDateToString(row.admission_date),
    createdAt:       row.created_at as string,
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

    // sp_get_students(p_tenant_id, p_status, p_class_id)
    const rows = await callProc<Record<string, unknown>>(
      'sp_get_students',
      [session.tenantId, null, null]
    );
    return NextResponse.json<ApiResponse<Student[]>>({
      success: true,
      data: rows.map(mapRow),
    });
  } catch (err) {
    console.error('[GET /api/students]', err);
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

    // sp_admit_student(tenant_id, first_name, last_name, date_of_birth, gender,
    //                  class_id, class_name, section, parent_name, parent_phone,
    //                  parent_email, address, admission_date)
    const row = await callProcOne<Record<string, unknown>>('sp_admit_student', [
      session.tenantId,
      body.firstName,
      body.lastName,
      body.dateOfBirth,
      body.gender ?? 'Male',
      body.classId,
      body.className ?? '',
      body.section ?? 'A',
      body.parentName,
      body.parentPhone,
      body.parentEmail ?? null,
      body.address ?? null,
      body.admissionDate ?? null,
    ]);

    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to admit student' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Student>>(
      { success: true, data: mapRow(row), message: 'Student admitted successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/students]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
