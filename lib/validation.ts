export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(value: unknown, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

export function validateStaff(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const requiredFields = ['firstName', 'lastName', 'email', 'department', 'designation', 'basicSalary'];
  for (const field of requiredFields) {
    const err = validateRequired(data[field], field);
    if (err) errors.push(err);
  }
  if (data.email && !validateEmail(data.email as string)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  if (data.basicSalary && Number(data.basicSalary) <= 0) {
    errors.push({ field: 'basicSalary', message: 'Basic salary must be positive' });
  }
  return { valid: errors.length === 0, errors };
}

export function validateStudent(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'classId', 'parentName', 'parentPhone'];
  for (const field of requiredFields) {
    const err = validateRequired(data[field], field);
    if (err) errors.push(err);
  }
  if (data.parentEmail && !validateEmail(data.parentEmail as string)) {
    errors.push({ field: 'parentEmail', message: 'Invalid parent email format' });
  }
  return { valid: errors.length === 0, errors };
}

export function validateFeePayment(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const requiredFields = ['studentId', 'feeCategoryId', 'paidAmount', 'paymentMode'];
  for (const field of requiredFields) {
    const err = validateRequired(data[field], field);
    if (err) errors.push(err);
  }
  if (data.paidAmount && Number(data.paidAmount) <= 0) {
    errors.push({ field: 'paidAmount', message: 'Payment amount must be positive' });
  }
  return { valid: errors.length === 0, errors };
}
