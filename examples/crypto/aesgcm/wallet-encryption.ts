/**
 * Wallet Encryption with AES-GCM
 *
 * Demonstrates:
 * - Encrypting Ethereum private keys
 * - Wallet file format (similar to keystore files)
 * - Secure key storage and retrieval
 * - Password-protected wallet operations
 */

import * as AesGcm from '../../../src/crypto/AesGcm/index.js';
import * as Secp256k1 from '../../../src/crypto/Secp256k1/index.js';
import * as Address from '../../../src/primitives/Address/index.js';

console.log('=== Wallet Encryption with AES-GCM ===\n');

// Wallet encryption format
interface EncryptedWallet {
  version: number;
  address: string;
  crypto: {
    cipher: 'aes-256-gcm';
    ciphertext: string;
    salt: string;
    nonce: string;
    iterations: number;
  };
  timestamp: number;
}

// Encrypt private key with password
async function encryptWallet(
  privateKey: Uint8Array,
  password: string,
): Promise<EncryptedWallet> {
  // Derive Ethereum address from private key
  const publicKey = Secp256k1.derivePublicKey(privateKey);
  const address = Address.fromPublicKey(publicKey);

  // Generate salt for PBKDF2
  const salt = crypto.getRandomValues(new Uint8Array(32)); // 32 bytes for extra security

  // Derive encryption key (600,000 iterations for wallet security)
  const iterations = 600000;
  const key = await AesGcm.deriveKey(password, salt, iterations, 256);

  // Generate nonce
  const nonce = AesGcm.generateNonce();

  // Encrypt private key
  const ciphertext = await AesGcm.encrypt(privateKey, key, nonce);

  // Create wallet object
  return {
    version: 1,
    address: Address.toHex(address),
    crypto: {
      cipher: 'aes-256-gcm',
      ciphertext: Buffer.from(ciphertext).toString('hex'),
      salt: Buffer.from(salt).toString('hex'),
      nonce: Buffer.from(nonce).toString('hex'),
      iterations,
    },
    timestamp: Date.now(),
  };
}

// Decrypt wallet with password
async function decryptWallet(
  wallet: EncryptedWallet,
  password: string,
): Promise<Uint8Array> {
  const { crypto: cryptoParams } = wallet;

  // Parse hex strings
  const salt = Buffer.from(cryptoParams.salt, 'hex');
  const nonce = Buffer.from(cryptoParams.nonce, 'hex');
  const ciphertext = Buffer.from(cryptoParams.ciphertext, 'hex');

  // Derive key
  const key = await AesGcm.deriveKey(password, salt, cryptoParams.iterations, 256);

  // Decrypt private key
  return await AesGcm.decrypt(ciphertext, key, nonce);
}

// Verify wallet password without decrypting
async function verifyWalletPassword(
  wallet: EncryptedWallet,
  password: string,
): Promise<boolean> {
  try {
    const privateKey = await decryptWallet(wallet, password);

    // Verify address matches
    const publicKey = Secp256k1.derivePublicKey(privateKey);
    const address = Address.fromPublicKey(publicKey);
    const addressHex = Address.toHex(address);

    return addressHex.toLowerCase() === wallet.address.toLowerCase();
  } catch {
    return false;
  }
}

// 1. Create encrypted wallet
console.log('1. Create Encrypted Wallet');
console.log('-'.repeat(40));

// Generate new private key
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);

// Derive address
const publicKey = Secp256k1.derivePublicKey(privateKey);
const address = Address.fromPublicKey(publicKey);

const password = 'secure-wallet-password-2024';

console.log(`Generated private key: ${Buffer.from(privateKey).toString('hex')}`);
console.log(`Address: ${Address.toHex(address)}`);
console.log(`Password: "${password}"`);

// Encrypt wallet
const encryptedWallet = await encryptWallet(privateKey, password);

console.log('\nEncrypted wallet:');
console.log(JSON.stringify(encryptedWallet, null, 2));
console.log();

// 2. Decrypt and verify wallet
console.log('2. Decrypt and Verify Wallet');
console.log('-'.repeat(40));

const decryptedKey = await decryptWallet(encryptedWallet, password);

console.log(`Decrypted private key: ${Buffer.from(decryptedKey).toString('hex')}`);
console.log(`Match: ${Buffer.from(decryptedKey).toString('hex') === Buffer.from(privateKey).toString('hex')}`);

// Verify address
const decryptedPublicKey = Secp256k1.derivePublicKey(decryptedKey);
const decryptedAddress = Address.fromPublicKey(decryptedPublicKey);

console.log(`Decrypted address: ${Address.toHex(decryptedAddress)}`);
console.log(`Address match: ${Address.toHex(decryptedAddress).toLowerCase() === encryptedWallet.address.toLowerCase()}\n`);

// 3. Password verification
console.log('3. Password Verification');
console.log('-'.repeat(40));

const correctPassword = password;
const wrongPassword = 'wrong-password';

const isCorrect = await verifyWalletPassword(encryptedWallet, correctPassword);
console.log(`Correct password: ${isCorrect ? '✓ Verified' : '✗ Failed'}`);

const isWrong = await verifyWalletPassword(encryptedWallet, wrongPassword);
console.log(`Wrong password: ${isWrong ? '✗ Accepted (UNEXPECTED)' : '✓ Rejected'}\n`);

// 4. Multiple wallets
console.log('4. Multiple Encrypted Wallets');
console.log('-'.repeat(40));

const wallets: EncryptedWallet[] = [];
const walletPasswords = ['pass1', 'pass2', 'pass3'];

console.log('Creating 3 encrypted wallets:\n');

for (let i = 0; i < 3; i++) {
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);

  const wallet = await encryptWallet(key, walletPasswords[i]);
  wallets.push(wallet);

  console.log(`Wallet ${i + 1}:`);
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Password: "${walletPasswords[i]}"`);
  console.log(`  Salt: ${wallet.crypto.salt.slice(0, 16)}...`);
}

console.log('\nAll wallets have unique salts and ciphertexts\n');

// 5. Wallet storage format
console.log('5. Wallet Storage (JSON File Format)');
console.log('-'.repeat(40));

const walletJson = JSON.stringify(encryptedWallet, null, 2);
const walletBytes = new TextEncoder().encode(walletJson);

console.log(`JSON size: ${walletBytes.length} bytes`);
console.log(`\nWallet file contents:`);
console.log(walletJson);
console.log('\nThis can be saved to disk as a keystore file\n');

// 6. Change wallet password
console.log('6. Change Wallet Password');
console.log('-'.repeat(40));

const oldPassword = password;
const newPassword = 'new-secure-password-2024';

console.log(`Old password: "${oldPassword}"`);
console.log(`New password: "${newPassword}"`);

// Decrypt with old password
const originalKey = await decryptWallet(encryptedWallet, oldPassword);

// Re-encrypt with new password
const reencryptedWallet = await encryptWallet(originalKey, newPassword);

console.log('\nWallet re-encrypted with new password');
console.log(`New salt: ${reencryptedWallet.crypto.salt.slice(0, 16)}...`);
console.log(`New nonce: ${reencryptedWallet.crypto.nonce}`);

// Verify old password no longer works
const oldWorks = await verifyWalletPassword(reencryptedWallet, oldPassword);
console.log(`Old password works: ${oldWorks ? '✗ Yes (UNEXPECTED)' : '✓ No'}`);

// Verify new password works
const newWorks = await verifyWalletPassword(reencryptedWallet, newPassword);
console.log(`New password works: ${newWorks ? '✓ Yes' : '✗ No'}`);

// Verify address unchanged
console.log(`Address preserved: ${reencryptedWallet.address === encryptedWallet.address}\n`);

// 7. Signing with decrypted wallet
console.log('7. Sign Message with Decrypted Wallet');
console.log('-'.repeat(40));

const message = 'Sign this message';
const messageBytes = new TextEncoder().encode(message);

// Decrypt wallet
const signingKey = await decryptWallet(encryptedWallet, password);

// Sign message
const signature = Secp256k1.sign(messageBytes, signingKey);

console.log(`Message: "${message}"`);
console.log(`Signature:`);
console.log(`  r: ${Buffer.from(signature.r).toString('hex')}`);
console.log(`  s: ${Buffer.from(signature.s).toString('hex')}`);
console.log(`  v: ${signature.v}`);

// Verify signature
const signingPublicKey = Secp256k1.derivePublicKey(signingKey);
const isValid = Secp256k1.verify(signature, messageBytes, signingPublicKey);

console.log(`\nSignature valid: ${isValid ? '✓' : '✗'}\n`);

// 8. Security recommendations
console.log('8. Security Best Practices');
console.log('-'.repeat(40));

console.log('Wallet encryption security:');
console.log('✓ Use strong passwords (12+ characters, mixed case, numbers, symbols)');
console.log('✓ High iteration count (600,000+) for PBKDF2');
console.log('✓ Unique salt per wallet (32+ bytes)');
console.log('✓ AES-256-GCM for encryption');
console.log('✓ Store wallet files with restricted permissions');
console.log('✓ Never log or transmit private keys');
console.log('✓ Clear sensitive memory after use');
console.log('✓ Regular password updates');
console.log('✓ Backup encrypted wallets securely\n');

console.log('=== Complete ===');
