/**
 * Public Key to Address Derivation Example
 *
 * Demonstrates:
 * - Deriving addresses from public keys (secp256k1)
 * - Deriving addresses from private keys
 * - Understanding the keccak256 derivation process
 * - Verifying address ownership
 */

import { Address } from '../../../src/primitives/Address/index.js';
import { Bytes } from '../../../src/primitives/Bytes/index.js';

console.log('=== Public Key to Address Derivation ===\n');

// 1. Deriving address from public key coordinates
console.log('1. Address from Public Key Coordinates\n');

// secp256k1 public key coordinates (256 bits each)
const publicKeyX = 0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75n;
const publicKeyY = 0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5n;

console.log('Public key coordinates:');
console.log(`  x: 0x${publicKeyX.toString(16)}`);
console.log(`  y: 0x${publicKeyY.toString(16)}`);
console.log();

// Derive address from public key
const addressFromPubKey = Address.fromPublicKey(publicKeyX, publicKeyY);
console.log(`Derived address: ${addressFromPubKey.toChecksummed()}`);
console.log();

// Explanation of the process
console.log('Derivation process:');
console.log('1. Concatenate x and y coordinates (64 bytes total)');
console.log('2. Hash with keccak256 → 32 bytes');
console.log('3. Take last 20 bytes → Ethereum address');
console.log();

// 2. Deriving address from private key
console.log('2. Address from Private Key\n');

// Private key (32 bytes) - DO NOT use this in production!
const privateKeyHex = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const privateKey = Bytes.fromHex(privateKeyHex);

console.log(`Private key: ${privateKeyHex}`);

// Derive address from private key
// Process: private key → public key (via secp256k1) → address (via keccak256)
const addressFromPrivKey = Address.fromPrivateKey(privateKey);
console.log(`Derived address: ${addressFromPrivKey.toChecksummed()}`);
console.log();

console.log('Derivation process:');
console.log('1. Multiply private key by secp256k1 generator point → public key (x, y)');
console.log('2. Concatenate x and y (64 bytes)');
console.log('3. Hash with keccak256 → 32 bytes');
console.log('4. Take last 20 bytes → Ethereum address');
console.log();

// 3. Multiple addresses from different keys
console.log('3. Multiple Addresses from Different Keys\n');

// Example known test keys (from hardhat/foundry)
const testKeys = [
  {
    name: 'Test Account 1',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    expectedAddr: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
  {
    name: 'Test Account 2',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    expectedAddr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
];

for (const test of testKeys) {
  console.log(`${test.name}:`);
  const pk = Bytes.fromHex(test.privateKey);
  const derived = Address.fromPrivateKey(pk);
  const expected = Address.fromHex(test.expectedAddr);

  console.log(`  Private key: ${test.privateKey}`);
  console.log(`  Derived:     ${derived.toChecksummed()}`);
  console.log(`  Expected:    ${expected.toChecksummed()}`);
  console.log(`  Match: ${derived.equals(expected) ? '✓' : '✗'}`);
  console.log();
}

// 4. Verifying address ownership
console.log('4. Verifying Address Ownership\n');

function canSign(address: Address, privateKey: Uint8Array): boolean {
  try {
    const derivedAddr = Address.fromPrivateKey(privateKey);
    return derivedAddr.equals(address);
  } catch {
    return false;
  }
}

const myAddress = Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
const myPrivateKey = Bytes.fromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const wrongPrivateKey = Bytes.fromHex("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");

console.log(`Address: ${myAddress.toChecksummed()}`);
console.log(`Can sign with correct key: ${canSign(myAddress, myPrivateKey)}`);
console.log(`Can sign with wrong key: ${canSign(myAddress, wrongPrivateKey)}`);
console.log();

// 5. Understanding the security model
console.log('5. Security Model\n');

console.log('Key relationships:');
console.log('├─ Private key (32 bytes) - SECRET, never share');
console.log('│  └─ Used to derive public key via secp256k1');
console.log('│');
console.log('├─ Public key (64 bytes: x, y coordinates) - Safe to share');
console.log('│  └─ Used to derive address via keccak256');
console.log('│');
console.log('└─ Address (20 bytes) - Public identifier');
console.log();

console.log('Security properties:');
console.log('✓ Cannot derive private key from public key (ECDLP hard problem)');
console.log('✓ Cannot derive public key from address (one-way hash)');
console.log('✓ Can verify signatures using public key');
console.log('✓ Can create signatures using private key');
console.log();

// 6. Common patterns
console.log('6. Common Patterns\n');

// Pattern 1: Generate wallet
console.log('Pattern 1: Generate wallet from seed/mnemonic');
console.log('  1. Derive private key from mnemonic (BIP-32/BIP-44)');
console.log('  2. Derive address from private key');
console.log('  3. Store only mnemonic, derive keys as needed');
console.log();

// Pattern 2: Import wallet
console.log('Pattern 2: Import wallet from private key');
console.log('  1. User provides private key');
console.log('  2. Derive address for display');
console.log('  3. Verify it matches expected address');
console.log();

// Pattern 3: Watch-only wallet
console.log('Pattern 3: Watch-only wallet (no private key)');
console.log('  1. User provides address only');
console.log('  2. Can view balances/transactions');
console.log('  3. Cannot sign transactions');
console.log();

// 7. Error handling
console.log('7. Error Handling\n');

// Invalid private key size
try {
  const wrongSize = new Uint8Array(16); // Must be 32 bytes
  Address.fromPrivateKey(wrongSize);
  console.log('ERROR: Should have thrown!');
} catch (e) {
  console.log(`✓ Invalid size rejected: ${(e as Error).message}`);
}

// All-zero private key (invalid)
try {
  const zeroKey = new Uint8Array(32); // All zeros
  Address.fromPrivateKey(zeroKey);
  console.log('ERROR: Should have thrown!');
} catch (e) {
  console.log(`✓ Zero private key rejected: ${(e as Error).message}`);
}
