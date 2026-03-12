import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, FeePayment } from '@/types';
import { validateFeePayment } from '@/lib/validation';
import { getSession } from '@/lib/auth';
import { callProc, callProcOne, pgDateToString } from '@/lib/db';

// ---------------------------------------------------------------------------
// DB row → FeePayment mapper
// ---------------------------------------------------------------------------
function mapRow(row: Record<string, unknown>): FeePayment {
  return {
    id:             row.id as string,
    tenantId:       row.tenant_id as string,
    studentId:      row.student_id as string,
    feeCategoryId:  row.fee_category_id as string,
    totalAmount:    Number(row.total_amount),
    paidAmount:     Number(row.paid_amount),
    balance:        Number(row.balance),
    lateFee:        Number(row.late_fee),
    receiptNumber:  (row.receipt_number as string) ?? '',
    paymentDate:    pgDateToString(row.payment_date),
    paymentMode:    (row.payment_mode as FeePayment['paymentMode']) ?? 'Cash',
    status:         row.status as FeePayment['status'],
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

    // sp_get_fee_payments(p_tenant_id, p_student_id, p_status)
    const rows = await callProc<Record<string, unknown>>(
      'sp_get_fee_payments',
      [session.tenantId, null, null]
    );
    return NextResponse.json<ApiResponse<FeePayment[]>>({
      success: true,
      data: rows.map(mapRow),
    });
  } catch (err) {
    console.error('[GET /api/fees]', err);
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
    const validation = validateFeePayment(body);
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

    // sp_record_fee_payment(tenant_id, student_id, fee_category_id,
    //                       paid_amount, payment_mode, payment_date)
    const row = await callProcOne<Record<string, unknown>>('sp_record_fee_payment', [
      session.tenantId,
      body.studentId,
      body.feeCategoryId,
      Number(body.paidAmount),
      body.paymentMode,
      body.paymentDate ?? null,
    ]);

    if (!row) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<FeePayment>>(
      { success: true, data: mapRow(row), message: 'Payment recorded successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/fees]', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
