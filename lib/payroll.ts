import type { Staff, Payroll, SalaryComponent } from '@/types';

export const DEFAULT_SALARY_COMPONENTS: SalaryComponent[] = [
  { name: 'HRA', type: 'percentage', value: 40, baseRef: 'basic' },
  { name: 'DA', type: 'percentage', value: 15, baseRef: 'basic' },
  { name: 'PF', type: 'percentage', value: 12, baseRef: 'basic' },
];

export function calculateLOP(
  basicSalary: number,
  lopDays: number,
  workingDaysInMonth: number = 26
): number {
  const perDaySalary = basicSalary / workingDaysInMonth;
  return Math.round(perDaySalary * lopDays * 100) / 100;
}

export function calculatePayroll(
  staff: Staff,
  month: number,
  year: number,
  lopDays: number = 0,
  components: SalaryComponent[] = DEFAULT_SALARY_COMPONENTS
): Omit<Payroll, 'id' | 'status' | 'processedAt'> {
  const basic = staff.basicSalary;

  let hra = 0,
    da = 0,
    pf = 0;

  for (const component of components) {
    const amount =
      component.type === 'percentage'
        ? Math.round((basic * component.value) / 100 * 100) / 100
        : component.value;

    if (component.name === 'HRA') hra = amount;
    else if (component.name === 'DA') da = amount;
    else if (component.name === 'PF') pf = amount;
  }

  const lopAmount = calculateLOP(basic, lopDays);
  const grossSalary = basic + hra + da;
  const netSalary = Math.round((grossSalary - pf - lopAmount) * 100) / 100;

  return {
    tenantId: staff.tenantId,
    staffId: staff.id,
    month,
    year,
    basicSalary: basic,
    hra,
    da,
    pf,
    lopDays,
    lopAmount,
    grossSalary: Math.round(grossSalary * 100) / 100,
    netSalary,
  };
}
