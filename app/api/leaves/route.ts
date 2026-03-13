import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, LeaveRequest } from '@/types';
import { getSession } from '@/lib/auth';
import { callProc, callProcOne, dateToString } from '@/lib/db';

// ---------------------------------------------------------------------------
// DB row → LeaveRequest mapper
// ---------------------------------------------------------------------------
function mapRow(row: Record<string, unknown>): LeaveRequest {
  return {
    id:         row.id as string,
    tenantId:   row.tenant_id as string,
    staffId:    row.staff_id as string,
    leaveType:  row.leave_type as LeaveRequest['leaveType'],
    startDate:  dateToString(row.start_date),
    endDate:    dateToString(row.end_date),
    days:       Number(row.days),
    reason:     (row.reason as string) ?? '',
    status:     row.status as LeaveRequest['status'],
    createdAt:  row.created_at as string,
  };
}

// GET /api/leaves            → all leave requests for the tenant
// GET /api/leaves?staffId=x  → scoped to one staff member
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId') ?? null;
    const status  = searchParams.get('status')  ?? null;

    // sp_get_leave_requests(p_tenant_id, p_staff_id, p_status)
    const rows = await callProc<Record<string, unknown>>(
      'sp_get_leave_requests',
      { p_tenant_id: session.tenantId, p_staff_id: staffId, p_status: status }
    );

    return NextResponse.json<ApiResponse<LeaveRequest[]>>({
      success: true,
      data: rows.map(mapRow),
    });
  } catch (err) {
    console.error('[GET /api/leaves]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leaves  → submit a new leave request
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
      leaveType?: string;
      startDate?: string;
      endDate?: string;
      reason?: string;
    };

    if (!body.staffId || !body.leaveType || !body.startDate || !body.endDate) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'staffId, leaveType, startDate and endDate are required' },
        { status: 400 }
      );
    }

    // sp_create_leave_request(...)
    const row = await callProcOne<Record<string, unknown>>('sp_create_leave_request', {
      p_tenant_id:  session.tenantId,
      p_staff_id:   body.staffId,
      p_leave_type: body.leaveType,
      p_start_date: body.startDate,
      p_end_date:   body.endDate,
      p_reason:     body.reason ?? null,
    });

    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to submit leave request' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<LeaveRequest>>(
      { success: true, data: mapRow(row), message: 'Leave request submitted' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/leaves]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
