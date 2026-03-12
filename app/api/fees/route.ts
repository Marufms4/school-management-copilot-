import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, FeePayment, FeeCategory } from '@/types';
import { calculateLateFee, generateReceiptNumber, getFeeStatus } from '@/lib/fees';
import { validateFeePayment } from '@/lib/validation';
import { getSession } from '@/lib/auth';

const mockCategories: FeeCategory[] = [
  {
    id: 'cat1',
    tenantId: 'school1',
    name: 'Annual Tuition Fee',
    type: 'Tuition',
    amount: 45000,
    dueDate: '2024-04-15',
    lateFeePerDay: 50,
  },
  {
    id: 'cat2',
    tenantId: 'school1',
    name: 'Transport Fee',
    type: 'Transport',
    amount: 12000,
    dueDate: '2024-04-15',
    lateFeePerDay: 20,
  },
  {
    id: 'cat3',
    tenantId: 'school1',
    name: 'Exam Fee',
    type: 'Exams',
    amount: 2500,
    dueDate: '2024-10-01',
    lateFeePerDay: 10,
  },
];

const mockPayments: FeePayment[] = [
  {
    id: 'fp1',
    tenantId: 'school1',
    studentId: '1',
    feeCategoryId: 'cat1',
    totalAmount: 45000,
    paidAmount: 45000,
    balance: 0,
    lateFee: 0,
    receiptNumber: 'RCP-SCHO-20240415-0001',
    paymentDate: '2024-04-10',
    paymentMode: 'Online',
    status: 'Paid',
  },
  {
    id: 'fp2',
    tenantId: 'school1',
    studentId: '2',
    feeCategoryId: 'cat1',
    totalAmount: 45000,
    paidAmount: 20000,
    balance: 25000,
    lateFee: 1500,
    receiptNumber: 'RCP-SCHO-20240420-0002',
    paymentDate: '2024-04-20',
    paymentMode: 'Cash',
    status: 'Partial',
  },
  {
    id: 'fp3',
    tenantId: 'school1',
    studentId: '3',
    feeCategoryId: 'cat2',
    totalAmount: 12000,
    paidAmount: 0,
    balance: 12000,
    lateFee: 3000,
    receiptNumber: '',
    paymentDate: '',
    paymentMode: 'Cash',
    status: 'Pending',
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
    const tenantPayments = mockPayments.filter((p) => p.tenantId === session.tenantId);
    return NextResponse.json<ApiResponse<FeePayment[]>>({ success: true, data: tenantPayments });
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

    const category = mockCategories.find(
      (c) => c.id === (body.feeCategoryId as string) && c.tenantId === session.tenantId
    );
    if (!category) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Fee category not found' },
        { status: 404 }
      );
    }

    const paymentDate = (body.paymentDate as string) || new Date().toISOString().slice(0, 10);
    const lateFee = calculateLateFee(category, paymentDate);
    const paidAmount = Number(body.paidAmount);
    const totalAmount = category.amount;
    const balance = Math.max(0, totalAmount + lateFee - paidAmount);

    const newPayment: FeePayment = {
      id: Date.now().toString(),
      tenantId: session.tenantId,
      studentId: body.studentId as string,
      feeCategoryId: body.feeCategoryId as string,
      totalAmount,
      paidAmount,
      balance,
      lateFee,
      receiptNumber: generateReceiptNumber(session.tenantId),
      paymentDate,
      paymentMode: body.paymentMode as FeePayment['paymentMode'],
      status: getFeeStatus({ totalAmount, paidAmount, balance, lateFee } as FeePayment),
    };
    mockPayments.push(newPayment);

    return NextResponse.json<ApiResponse<FeePayment>>(
      { success: true, data: newPayment, message: 'Payment recorded successfully' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
