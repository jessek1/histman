// HistMan TOTP (Time-based One-Time Password) Implementation
// Compatible with Google Authenticator, Authy, etc.

// Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate a random secret key (20 bytes = 160 bits)
function generateSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

// Base32 encode
function base32Encode(buffer) {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

// Base32 decode
function base32Decode(encoded) {
  encoded = encoded.toUpperCase().replace(/\s/g, '');
  const bytes = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

// HMAC-SHA1 implementation using Web Crypto API
async function hmacSha1(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

// Generate TOTP code
async function generateTOTP(secret, timeStep = 30, digits = 6) {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);

  // Convert time to 8-byte big-endian buffer
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);

  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, digits);

  return code.toString().padStart(digits, '0');
}

// Verify TOTP code (allows 1 step tolerance for clock drift)
async function verifyTOTP(secret, code, timeStep = 30, digits = 6) {
  const normalizedCode = code.replace(/\s/g, '');

  // Check current time and +/- 1 time step for clock drift tolerance
  for (let offset = -1; offset <= 1; offset++) {
    const time = Math.floor(Date.now() / 1000 / timeStep) + offset;
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));

    const truncOffset = hmac[hmac.length - 1] & 0x0f;
    const generatedCode = (
      ((hmac[truncOffset] & 0x7f) << 24) |
      ((hmac[truncOffset + 1] & 0xff) << 16) |
      ((hmac[truncOffset + 2] & 0xff) << 8) |
      (hmac[truncOffset + 3] & 0xff)
    ) % Math.pow(10, digits);

    if (generatedCode.toString().padStart(digits, '0') === normalizedCode) {
      return true;
    }
  }

  return false;
}

// Generate otpauth:// URI for QR code
function generateOTPAuthURI(secret, accountName, issuer = 'HistMan') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Export functions
window.HistManTOTP = {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateOTPAuthURI
};
