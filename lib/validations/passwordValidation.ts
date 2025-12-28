/**
 * Real-time password validation utilities
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validate password in real-time
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const errors: string[] = [];
  
  if (!checks.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!checks.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!checks.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!checks.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!checks.hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
}

/**
 * Check if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

