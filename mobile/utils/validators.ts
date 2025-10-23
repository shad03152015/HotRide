/**
 * Client-side validation functions
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * Accepts international format with + and at least 10 digits
 */
export function validatePhone(phone: string): boolean {
  // Remove common phone number characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Check if starts with + or is all digits
  if (cleaned.startsWith('+')) {
    const digits = cleaned.substring(1);
    return /^\d{10,}$/.test(digits);
  }

  return /^\d{10,}$/.test(cleaned);
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  return { isValid: true };
}

/**
 * Quick check if text looks like email
 */
export function isEmail(text: string): boolean {
  return text.includes('@');
}

/**
 * Quick check if text looks like phone number
 */
export function isPhone(text: string): boolean {
  const cleaned = text.replace(/[\s\-\(\)]/g, '');
  return cleaned.startsWith('+') || /^\d+$/.test(cleaned);
}
