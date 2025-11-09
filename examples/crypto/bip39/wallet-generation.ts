/**
 * Wallet Generation with BIP-39
 *
 * Demonstrates:
 * - Creating new wallets from mnemonics
 * - Deriving Ethereum addresses
 * - Complete wallet backup/restore flow
 * - Multiple account generation
 * - Mnemonic phrase formatting
 */

import * as Bip39 from '../../../src/crypto/Bip39/index.js';
import * as HDWallet from '../../../src/crypto/HDWallet/index.js';
import * as Secp256k1 from '../../../src/crypto/Secp256k1/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

console.log('=== Wallet Generation with BIP-39 ===\n');

// 1. Generate new wallet
console.log('1. Generate New Wallet');
console.log('-'.repeat(40));

// Generate 24-word mnemonic (recommended for production)
const mnemonic = Bip39.generateMnemonic(256);

console.log('NEW WALLET CREATED');
console.log('⚠️  BACKUP THIS MNEMONIC PHRASE ⚠️\n');
console.log('Mnemonic (24 words):');

// Format mnemonic nicely (4 columns of 6 words)
const words = mnemonic.split(' ');
for (let i = 0; i < words.length; i += 6) {
  const row = words.slice(i, i + 6);
  console.log(`  ${row.map((w, j) => `${(i + j + 1).toString().padStart(2)}. ${w.padEnd(12)}`).join(' ')}`);
}

console.log('\n✓ Write down these words in order');
console.log('✓ Store in a secure location');
console.log('✓ Never share with anyone\n');

// 2. Derive wallet from mnemonic
console.log('2. Derive Wallet from Mnemonic');
console.log('-'.repeat(40));

// Convert to seed
const seed = await Bip39.mnemonicToSeed(mnemonic);
console.log(`Seed: ${Hex.fromBytes(seed).slice(0, 64)}...`);

// Create HD wallet root
const root = HDWallet.fromSeed(seed);
console.log('HD wallet root created\n');

// 3. Derive Ethereum addresses
console.log('3. Derive Ethereum Addresses');
console.log('-'.repeat(40));

const accounts = [];
for (let i = 0; i < 5; i++) {
  // Derive key at m/44'/60'/0'/0/i
  const hdKey = HDWallet.deriveEthereum(root, 0, i);

  // Get private key
  const privateKey = HDWallet.getPrivateKey(hdKey);
  if (!privateKey) throw new Error('No private key');

  // Derive public key and address
  const publicKey = Secp256k1.derivePublicKey(privateKey);
  const address = Address.fromPublicKey(publicKey);

  accounts.push({
    index: i,
    path: `m/44'/60'/0'/0/${i}`,
    privateKey,
    address,
  });

  console.log(`Account ${i}:`);
  console.log(`  Path: ${accounts[i].path}`);
  console.log(`  Address: ${Address.toHex(address)}`);
}
console.log();

// 4. Wallet backup
console.log('4. Wallet Backup Format');
console.log('-'.repeat(40));

const backup = {
  mnemonic,
  accounts: accounts.map((acc) => ({
    index: acc.index,
    path: acc.path,
    address: Address.toHex(acc.address),
  })),
  created: new Date().toISOString(),
};

console.log('Wallet backup (DO NOT SHARE):');
console.log(JSON.stringify(backup, null, 2));
console.log('\nNote: Only mnemonic needed for full recovery\n');

// 5. Wallet restoration
console.log('5. Wallet Restoration');
console.log('-'.repeat(40));

// Simulate user restoring wallet
const restoredMnemonic = mnemonic; // In reality, user would input this

console.log('Restoring wallet from mnemonic...');

// Validate mnemonic
if (!Bip39.validateMnemonic(restoredMnemonic)) {
  throw new Error('Invalid mnemonic phrase');
}

// Derive seed
const restoredSeed = await Bip39.mnemonicToSeed(restoredMnemonic);
const restoredRoot = HDWallet.fromSeed(restoredSeed);

// Restore first account
const restoredHdKey = HDWallet.deriveEthereum(restoredRoot, 0, 0);
const restoredPrivateKey = HDWallet.getPrivateKey(restoredHdKey);
if (!restoredPrivateKey) throw new Error('No private key');

const restoredPublicKey = Secp256k1.derivePublicKey(restoredPrivateKey);
const restoredAddress = Address.fromPublicKey(restoredPublicKey);

console.log('✓ Wallet restored successfully');
console.log(`Original address:  ${Address.toHex(accounts[0].address)}`);
console.log(`Restored address:  ${Address.toHex(restoredAddress)}`);
console.log(`Match: ${Address.toHex(accounts[0].address) === Address.toHex(restoredAddress)}\n`);

// 6. Mnemonic with passphrase
console.log('6. Mnemonic with Passphrase (BIP-39 Extension)');
console.log('-'.repeat(40));

const passphrase = 'additional-security-layer';

console.log(`Mnemonic: ${mnemonic.split(' ').slice(0, 3).join(' ')}...`);
console.log(`Passphrase: "${passphrase}"\n`);

// Same mnemonic, different passphrases = different wallets
const seedNoPass = await Bip39.mnemonicToSeed(mnemonic);
const seedWithPass = await Bip39.mnemonicToSeed(mnemonic, passphrase);

const rootNoPass = HDWallet.fromSeed(seedNoPass);
const rootWithPass = HDWallet.fromSeed(seedWithPass);

const addrNoPass = deriveFirstAddress(rootNoPass);
const addrWithPass = deriveFirstAddress(rootWithPass);

console.log('Different wallets from same mnemonic:');
console.log(`No passphrase:  ${Address.toHex(addrNoPass)}`);
console.log(`With passphrase: ${Address.toHex(addrWithPass)}`);
console.log(`Different: ${Address.toHex(addrNoPass) !== Address.toHex(addrWithPass)}`);

console.log('\n⚠️  Losing passphrase = losing access to wallet\n');

// 7. Mnemonic phrase validation helpers
console.log('7. Mnemonic Validation Helpers');
console.log('-'.repeat(40));

const userInput = '  abandon  ABANDON   abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  about  ';

// Normalize mnemonic (trim, lowercase, single spaces)
const normalized = userInput.trim().toLowerCase().replace(/\s+/g, ' ');

console.log(`User input: "${userInput}"`);
console.log(`Normalized: "${normalized}"`);
console.log(`Valid: ${Bip39.validateMnemonic(normalized)}\n`);

// 8. Multi-account wallet
console.log('8. Multi-Account Wallet (HD Hierarchy)');
console.log('-'.repeat(40));

console.log('Deriving multiple accounts from same seed:\n');

for (let account = 0; account < 3; account++) {
  console.log(`Account ${account}:`);

  for (let index = 0; index < 2; index++) {
    const hdKey = HDWallet.deriveEthereum(root, account, index);
    const privateKey = HDWallet.getPrivateKey(hdKey);
    if (!privateKey) continue;

    const publicKey = Secp256k1.derivePublicKey(privateKey);
    const address = Address.fromPublicKey(publicKey);

    console.log(`  Address ${index} (m/44'/60'/${account}'/0/${index}): ${Address.toHex(address)}`);
  }
  console.log();
}

// 9. Checksum verification
console.log('9. Checksum Verification (Last Word)');
console.log('-'.repeat(40));

const testMnemonic = Bip39.generateMnemonic(128);
const testWords = testMnemonic.split(' ');

console.log(`Valid mnemonic: ${testMnemonic}`);
console.log(`Last word (checksum): "${testWords[testWords.length - 1]}"`);

// Change last word
testWords[testWords.length - 1] = 'zoo';
const invalidMnemonic = testWords.join(' ');

console.log(`\nModified last word: "${testWords[testWords.length - 1]}"`);
console.log(`Invalid mnemonic: ${invalidMnemonic}`);
console.log(`Valid: ${Bip39.validateMnemonic(invalidMnemonic)}\n`);

// 10. Security recommendations
console.log('10. Security Best Practices');
console.log('-'.repeat(40));

console.log('Mnemonic generation:');
console.log('✓ Use cryptographically secure randomness');
console.log('✓ Generate offline on air-gapped device');
console.log('✓ Use 24 words for maximum security');
console.log('✓ Verify backup by restoring test wallet');

console.log('\nMnemonic storage:');
console.log('✓ Write on paper or engrave on metal');
console.log('✓ Store in multiple secure locations');
console.log('✓ Never store digitally unencrypted');
console.log('✓ Consider split storage (Shamir backup)');

console.log('\nPassphrase usage:');
console.log('✓ Optional but adds security layer');
console.log('✓ Store separately from mnemonic');
console.log('✓ Use strong, memorable passphrase');
console.log('✓ Losing passphrase = losing wallet');

console.log('\nGeneral security:');
console.log('✓ Never share mnemonic with anyone');
console.log('✓ Beware of phishing attempts');
console.log('✓ Use hardware wallets for large amounts');
console.log('✓ Test recovery process with small amount first\n');

console.log('=== Complete ===');

// Helper function
function deriveFirstAddress(hdRoot: any): any {
  const hdKey = HDWallet.deriveEthereum(hdRoot, 0, 0);
  const privateKey = HDWallet.getPrivateKey(hdKey);
  if (!privateKey) throw new Error('No private key');
  const publicKey = Secp256k1.derivePublicKey(privateKey);
  return Address.fromPublicKey(publicKey);
}
