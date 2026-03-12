import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { getSession } from '@/lib/auth';
import { callProcVoid } from '@/lib/db';

// PATCH /api/leaves/[id]  → approve or reject a leave request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !['Approved', 'Rejected'].includes(body.status)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'status must be Approved or Rejected' },
        { status: 400 }
      );
    }

    // sp_update_leave_status(p_tenant_id, p_leave_id, p_status, p_reviewer_id)
    await callProcVoid('sp_update_leave_status', [
      session.tenantId,
      id,
      body.status,
      session.id,
    ]);

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: `Leave request ${body.status.toLowerCase()}`,
    });
  } catch (err) {
    console.error('[PATCH /api/leaves/[id]]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
