/**
 * Password-Based AES-GCM Encryption
 *
 * Demonstrates:
 * - Deriving encryption key from password using PBKDF2
 * - Salt generation and storage
 * - Encrypting data with password-derived key
 * - Complete encrypt/decrypt workflow with password
 * - Secure password handling
 */

import * as AesGcm from '../../../src/crypto/AesGcm/index.js';

console.log('=== Password-Based AES-GCM Encryption ===\n');

// Helper functions for complete encrypt/decrypt workflow
async function encryptWithPassword(
  plaintext: Uint8Array,
  password: string,
): Promise<{ salt: Uint8Array; nonce: Uint8Array; ciphertext: Uint8Array }> {
  // Generate random salt for PBKDF2
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive 256-bit key from password
  // Using 600,000 iterations (OWASP 2023 recommendation)
  const key = await AesGcm.deriveKey(password, salt, 600000, 256);

  // Generate nonce
  const nonce = AesGcm.generateNonce();

  // Encrypt
  const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

  return { salt, nonce, ciphertext };
}

async function decryptWithPassword(
  encrypted: { salt: Uint8Array; nonce: Uint8Array; ciphertext: Uint8Array },
  password: string,
): Promise<Uint8Array> {
  // Derive same key from password + salt
  const key = await AesGcm.deriveKey(password, encrypted.salt, 600000, 256);

  // Decrypt
  return await AesGcm.decrypt(encrypted.ciphertext, key, encrypted.nonce);
}

// 1. Basic password-based encryption
console.log('1. Encrypt and Decrypt with Password');
console.log('-'.repeat(40));

const password = 'my-secure-passphrase-2024';
const secretData = 'Confidential information';
const plaintext = new TextEncoder().encode(secretData);

console.log(`Password: "${password}"`);
console.log(`Message: "${secretData}"`);

// Encrypt
const encrypted = await encryptWithPassword(plaintext, password);

console.log(`\nEncrypted components:`);
console.log(`  Salt: ${Buffer.from(encrypted.salt).toString('hex')} (${encrypted.salt.length} bytes)`);
console.log(`  Nonce: ${Buffer.from(encrypted.nonce).toString('hex')} (${encrypted.nonce.length} bytes)`);
console.log(`  Ciphertext: ${Buffer.from(encrypted.ciphertext).toString('hex').slice(0, 40)}... (${encrypted.ciphertext.length} bytes)`);

// Decrypt
const decrypted = await decryptWithPassword(encrypted, password);
const decryptedMessage = new TextDecoder().decode(decrypted);

console.log(`\nDecrypted: "${decryptedMessage}"`);
console.log(`Match: ${decryptedMessage === secretData}\n`);

// 2. Different passwords produce different results
console.log('2. Password Uniqueness');
console.log('-'.repeat(40));

const message = new TextEncoder().encode('Test data');
const password1 = 'password-one';
const password2 = 'password-two';

const enc1 = await encryptWithPassword(message, password1);
const enc2 = await encryptWithPassword(message, password2);

console.log('Same message, different passwords:');
console.log(`Password 1 ciphertext: ${Buffer.from(enc1.ciphertext).toString('hex').slice(0, 40)}...`);
console.log(`Password 2 ciphertext: ${Buffer.from(enc2.ciphertext).toString('hex').slice(0, 40)}...`);
console.log(`Different: ${Buffer.from(enc1.ciphertext).toString('hex') !== Buffer.from(enc2.ciphertext).toString('hex')}\n`);

// 3. Wrong password fails
console.log('3. Wrong Password Detection');
console.log('-'.repeat(40));

const correctPassword = 'correct-password';
const wrongPassword = 'wrong-password';

const testData = new TextEncoder().encode('Secret');
const testEncrypted = await encryptWithPassword(testData, correctPassword);

// Correct password
try {
  const dec = await decryptWithPassword(testEncrypted, correctPassword);
  console.log('✓ Correct password accepted');
} catch (error) {
  console.log('❌ Correct password rejected (UNEXPECTED)');
}

// Wrong password
try {
  await decryptWithPassword(testEncrypted, wrongPassword);
  console.log('❌ Wrong password accepted (UNEXPECTED)');
} catch (error) {
  console.log('✓ Wrong password rejected\n');
}

// 4. Salt importance
console.log('4. Salt Uniqueness (Same Password, Different Salts)');
console.log('-'.repeat(40));

const samePassword = 'same-password';
const sameMessage = new TextEncoder().encode('Same message');

const result1 = await encryptWithPassword(sameMessage, samePassword);
const result2 = await encryptWithPassword(sameMessage, samePassword);

console.log('Same password + message, different salts:');
console.log(`Salt 1: ${Buffer.from(result1.salt).toString('hex')}`);
console.log(`Salt 2: ${Buffer.from(result2.salt).toString('hex')}`);
console.log(`Different salts: ${Buffer.from(result1.salt).toString('hex') !== Buffer.from(result2.salt).toString('hex')}`);
console.log(`Different ciphertexts: ${Buffer.from(result1.ciphertext).toString('hex') !== Buffer.from(result2.ciphertext).toString('hex')}\n`);

// 5. Iteration count impact
console.log('5. PBKDF2 Iteration Count');
console.log('-'.repeat(40));

const testPassword = 'test-password';
const testSalt = crypto.getRandomValues(new Uint8Array(16));

console.log('Deriving keys with different iteration counts:');

// Low iterations (fast, less secure)
const startLow = Date.now();
const keyLow = await AesGcm.deriveKey(testPassword, testSalt, 10000, 256);
const timeLow = Date.now() - startLow;
console.log(`  10,000 iterations: ${timeLow}ms`);

// Medium iterations (balanced)
const startMed = Date.now();
const keyMed = await AesGcm.deriveKey(testPassword, testSalt, 100000, 256);
const timeMed = Date.now() - startMed;
console.log(` 100,000 iterations: ${timeMed}ms`);

// High iterations (slow, more secure)
const startHigh = Date.now();
const keyHigh = await AesGcm.deriveKey(testPassword, testSalt, 600000, 256);
const timeHigh = Date.now() - startHigh;
console.log(` 600,000 iterations: ${timeHigh}ms (OWASP 2023 recommended)`);

console.log('\nHigher iterations = better security against brute force');
console.log('Trade-off: User experience vs security\n');

// 6. Storage format example
console.log('6. Storage Format');
console.log('-'.repeat(40));

const storageData = new TextEncoder().encode('Data to store');
const storagePassword = 'storage-password';

const encryptedData = await encryptWithPassword(storageData, storagePassword);

// Format for storage (concatenate salt + nonce + ciphertext)
const storedBytes = new Uint8Array(
  encryptedData.salt.length +
  encryptedData.nonce.length +
  encryptedData.ciphertext.length
);
let offset = 0;
storedBytes.set(encryptedData.salt, offset);
offset += encryptedData.salt.length;
storedBytes.set(encryptedData.nonce, offset);
offset += encryptedData.nonce.length;
storedBytes.set(encryptedData.ciphertext, offset);

console.log('Storage format: [salt(16) | nonce(12) | ciphertext+tag]');
console.log(`Total size: ${storedBytes.length} bytes`);
console.log(`  Salt: bytes 0-15 (${encryptedData.salt.length} bytes)`);
console.log(`  Nonce: bytes 16-27 (${encryptedData.nonce.length} bytes)`);
console.log(`  Ciphertext+Tag: bytes 28-end (${encryptedData.ciphertext.length} bytes)`);

// Extract and decrypt
const extractedSalt = storedBytes.slice(0, 16);
const extractedNonce = storedBytes.slice(16, 28);
const extractedCiphertext = storedBytes.slice(28);

const extractedDecrypted = await decryptWithPassword(
  { salt: extractedSalt, nonce: extractedNonce, ciphertext: extractedCiphertext },
  storagePassword
);

console.log(`\nExtracted and decrypted: "${new TextDecoder().decode(extractedDecrypted)}"`);
console.log(`Match: ${new TextDecoder().decode(extractedDecrypted) === new TextDecoder().decode(storageData)}\n`);

// 7. Key strength comparison
console.log('7. Key Strength (128-bit vs 256-bit)');
console.log('-'.repeat(40));

const pwd = 'test';
const salt = crypto.getRandomValues(new Uint8Array(16));
const data = new TextEncoder().encode('test data');

const key128 = await AesGcm.deriveKey(pwd, salt, 100000, 128);
const key256 = await AesGcm.deriveKey(pwd, salt, 100000, 256);

const nonce128 = AesGcm.generateNonce();
const nonce256 = AesGcm.generateNonce();

const ct128 = await AesGcm.encrypt(data, key128, nonce128);
const ct256 = await AesGcm.encrypt(data, key256, nonce256);

console.log(`AES-128-GCM: ${ct128.length} bytes`);
console.log(`AES-256-GCM: ${ct256.length} bytes`);
console.log(`\nNote: Same ciphertext size, but AES-256 is more secure`);
console.log(`Recommended: Use 256-bit keys for sensitive data\n`);

console.log('=== Complete ===');
