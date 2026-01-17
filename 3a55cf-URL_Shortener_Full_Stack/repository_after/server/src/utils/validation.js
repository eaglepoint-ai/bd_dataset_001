const RESERVED_WORDS = ['api', 'admin', 'static', 'health', 'urls', 'http', 'https'];

function isValidUrl(string) {
  if (!string || typeof string !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function validateShortCode(code) {
  if (code === null || code === undefined || code === '') {
    return { valid: true, autoGenerate: true };
  }
  
  if (typeof code !== 'string') {
    return { 
      valid: false, 
      error: 'Custom code must be a string', 
      code: 'INVALID_CODE' 
    };
  }
  
  const trimmedCode = code.trim();
  
  if (trimmedCode.length < 4 || trimmedCode.length > 20) {
    return { 
      valid: false, 
      error: 'Custom code must be 4-20 characters long', 
      code: 'INVALID_CODE' 
    };
  }
  
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(trimmedCode)) {
    return { 
      valid: false, 
      error: 'Custom code can only contain letters, numbers, and hyphens', 
      code: 'INVALID_CODE' 
    };
  }
  
  if (RESERVED_WORDS.includes(trimmedCode.toLowerCase())) {
    return { 
      valid: false, 
      error: `"${trimmedCode}" is a reserved word and cannot be used`, 
      code: 'RESERVED_CODE' 
    };
  }
  
  return { valid: true, shortCode: trimmedCode };
}

function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${message}:`, error?.message || error);
}

module.exports = { 
  isValidUrl, 
  validateShortCode, 
  generateShortCode,
  logError,
  RESERVED_WORDS 
};
