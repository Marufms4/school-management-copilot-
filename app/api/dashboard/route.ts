import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, DashboardStats } from '@/types';
import { getSession } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats: DashboardStats = {
      tenantId: session.tenantId,
      totalStudents: 842,
      totalStaff: 64,
      monthlyRevenue: 1250000,
      monthlyExpense: 890000,
      pendingFees: 320000,
      revenueData: [
        { month: 'Jul', revenue: 1100000, expense: 820000 },
        { month: 'Aug', revenue: 1150000, expense: 840000 },
        { month: 'Sep', revenue: 1200000, expense: 860000 },
        { month: 'Oct', revenue: 1180000, expense: 855000 },
        { month: 'Nov', revenue: 1220000, expense: 870000 },
        { month: 'Dec', revenue: 1250000, expense: 890000 },
        { month: 'Jan', revenue: 1300000, expense: 900000 },
        { month: 'Feb', revenue: 1280000, expense: 885000 },
        { month: 'Mar', revenue: 1350000, expense: 910000 },
        { month: 'Apr', revenue: 1400000, expense: 930000 },
        { month: 'May', revenue: 1380000, expense: 920000 },
        { month: 'Jun', revenue: 1250000, expense: 890000 },
      ],
    };

    return NextResponse.json<ApiResponse<DashboardStats>>({ success: true, data: stats });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
