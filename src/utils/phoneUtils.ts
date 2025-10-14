/**
 * Utility functions for phone number handling and validation
 */

/**
 * Converts a 10-digit Indian phone number to E.164 format with +91 prefix
 * @param phoneNumber - The phone number to convert (can be 10 digits or already have +91)
 * @returns The phone number in E.164 format (+91XXXXXXXXXX)
 */
export const convertToE164Format = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // If it already starts with 91 and is 12 digits, add + prefix
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return `+${cleanPhone}`;
  }
  
  // If it's a 10-digit number, add +91 prefix
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  }
  
  // If it's already in correct format, return as is
  if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
    return phoneNumber;
  }
  
  // For any other case, assume it's a 10-digit number and add +91
  return `+91${cleanPhone.slice(-10)}`;
};

/**
 * Validates if a phone number is a valid 10-digit Indian mobile number
 * @param phoneNumber - The phone number to validate
 * @returns true if valid, false otherwise
 */
export const isValidIndianPhoneNumber = (phoneNumber: string): boolean => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  if (cleanPhone.length === 10) {
    // Indian mobile numbers start with 6, 7, 8, or 9
    return /^[6-9]\d{9}$/.test(cleanPhone);
  }
  
  // Check if it's 12 digits starting with 91
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const mobileNumber = cleanPhone.substring(2);
    return /^[6-9]\d{9}$/.test(mobileNumber);
  }
  
  return false;
};

/**
 * Extracts the 10-digit mobile number from E.164 format for display purposes
 * @param e164Number - Phone number in E.164 format (+91XXXXXXXXXX)
 * @returns The 10-digit mobile number
 */
export const extractDisplayNumber = (e164Number: string): string => {
  const cleanPhone = e164Number.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return cleanPhone.substring(2);
  }
  
  return cleanPhone.slice(-10);
};
