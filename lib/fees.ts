import type { FeeCategory, FeePayment } from '@/types';

export function calculateLateFee(category: FeeCategory, paymentDate: string): number {
  const due = new Date(category.dueDate);
  const payment = new Date(paymentDate);

  if (payment <= due) return 0;

  const diffMs = payment.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.round(diffDays * category.lateFeePerDay * 100) / 100;
}

export function generateReceiptNumber(tenantId: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `RCP-${tenantId.slice(0, 4).toUpperCase()}-${dateStr}-${random}`;
}

export function calculateFeeBalance(payment: FeePayment): number {
  return Math.max(0, payment.totalAmount + payment.lateFee - payment.paidAmount);
}

export function getFeeStatus(payment: FeePayment): FeePayment['status'] {
  const balance = calculateFeeBalance(payment);
  if (balance <= 0) return 'Paid';
  if (payment.paidAmount > 0) return 'Partial';
  return 'Pending';
}
