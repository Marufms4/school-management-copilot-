import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Payroll } from '@/types';
import { getSession } from '@/lib/auth';
import { callProc, callProcOne } from '@/lib/db';

// ---------------------------------------------------------------------------
// DB row → Payroll mapper
// ---------------------------------------------------------------------------
function mapRow(row: Record<string, unknown>): Payroll {
  return {
    id:           row.id as string,
    tenantId:     row.tenant_id as string,
    staffId:      row.staff_id as string,
    month:        Number(row.month),
    year:         Number(row.year),
    basicSalary:  Number(row.basic_salary),
    hra:          Number(row.hra),
    da:           Number(row.da),
    pf:           Number(row.pf),
    lopDays:      Number(row.lop_days),
    lopAmount:    Number(row.lop_amount),
    grossSalary:  Number(row.gross_salary),
    netSalary:    Number(row.net_salary),
    status:       row.status as Payroll['status'],
    processedAt:  row.processed_at as string | undefined,
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

    // sp_get_payroll(p_tenant_id, p_staff_id, p_month, p_year)
    const rows = await callProc<Record<string, unknown>>(
      'sp_get_payroll',
      [session.tenantId, null, null, null]
    );
    return NextResponse.json<ApiResponse<Payroll[]>>({
      success: true,
      data: rows.map(mapRow),
    });
  } catch (err) {
    console.error('[GET /api/payroll]', err);
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
    const { staffId, month, year, lopDays = null } = body;

    if (!staffId || !month || !year) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'staffId, month, and year are required' },
        { status: 400 }
      );
    }

    // sp_process_payroll(p_tenant_id, p_staff_id, p_month, p_year, p_lop_days)
    // When p_lop_days is null the SP auto-calculates from approved leave records.
    const row = await callProcOne<Record<string, unknown>>('sp_process_payroll', [
      session.tenantId,
      staffId,
      month,
      year,
      lopDays,
    ]);

    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to process payroll' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Payroll>>(
      { success: true, data: mapRow(row), message: 'Payroll processed' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/payroll]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
