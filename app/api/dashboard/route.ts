import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, DashboardStats } from '@/types';
import { getSession } from '@/lib/auth';
import { callProcOne, callProc } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // sp_get_dashboard_stats(p_tenant_id)
    const statsRow = await callProcOne<Record<string, unknown>>(
      'sp_get_dashboard_stats',
      { p_tenant_id: session.tenantId }
    );

    // sp_get_revenue_trend(p_tenant_id, p_months)
    const trendRows = await callProc<Record<string, unknown>>(
      'sp_get_revenue_trend',
      { p_tenant_id: session.tenantId, p_months: 12 }
    );

    const stats: DashboardStats = {
      tenantId:       session.tenantId,
      totalStudents:  Number(statsRow?.total_students ?? 0),
      totalStaff:     Number(statsRow?.total_staff ?? 0),
      monthlyRevenue: Number(statsRow?.monthly_revenue ?? 0),
      monthlyExpense: Number(statsRow?.monthly_expense ?? 0),
      pendingFees:    Number(statsRow?.pending_fees ?? 0),
      revenueData:    trendRows.map((r) => ({
        month:   r.month_label as string,
        revenue: Number(r.revenue),
        expense: Number(r.expense),
      })),
    };

    return NextResponse.json<ApiResponse<DashboardStats>>({ success: true, data: stats });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
