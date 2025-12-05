// HistMan Crypto Utilities
// Password hashing using Web Crypto API

// Generate a random salt
async function generateSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return arrayBufferToBase64(salt);
}

// Hash password with salt using PBKDF2
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToArrayBuffer(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return arrayBufferToBase64(derivedBits);
}

// Verify password against stored hash
async function verifyPassword(password, salt, storedHash) {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Export functions for use in popup.js
window.HistManCrypto = {
  generateSalt,
  hashPassword,
  verifyPassword,
  arrayBufferToBase64,
  base64ToArrayBuffer
};
