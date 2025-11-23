export const cryptoExamples = {
  'keccak256.ts': `// Keccak256: Ethereum's primary hash function
import { Keccak256 } from 'voltaire/crypto/Keccak256';
import * as Hex from 'voltaire/primitives/Hex';

// Hash a string - returns 32-byte Uint8Array (Keccak256Hash)
const hash = Keccak256.hashString('Hello Voltaire!');
console.log('Keccak256 hash:', Hex.fromBytes(hash).toString());
console.log('Hash length:', hash.length, 'bytes (always 32)');
console.log('Type:', hash.constructor.name);

// Hash raw bytes
const data = new TextEncoder().encode('Test');
const bytesHash = Keccak256.hash(data);
console.log('Bytes hash:', Hex.fromBytes(bytesHash).toString());

// Hash empty data
const emptyHash = Keccak256.hash(new Uint8Array(0));
console.log('Empty hash:', Hex.fromBytes(emptyHash).toString());
`,

  'sha256.ts': `// SHA256: Hashing algorithm
import { hash, hashString } from 'voltaire/crypto/SHA256';
import { Hex } from 'voltaire/primitives/Hex';

// Hash a string directly
const stringHash = hashString('Hello World');
console.log('SHA256 hash:', Hex.from(stringHash).toString());
console.log('Hash length:', stringHash.length, 'bytes');

// Double hash
const doubleHash = hash(stringHash);
console.log('Double hash:', Hex.from(doubleHash).toString());
`,

  'blake2.ts': `// Blake2: Fast cryptographic hash
import { hash, hashString } from 'voltaire/crypto/Blake2';
import { Hex } from 'voltaire/primitives/Hex';

// Hash a string
const stringHash = hashString('Voltaire');
console.log('Blake2 hash:', Hex.from(stringHash).toString());
console.log('Hash length:', stringHash.length, 'bytes');

// Hash bytes
const bytes = new TextEncoder().encode('Data');
const bytesHash = hash(bytes);
console.log('Bytes hash:', Hex.from(bytesHash).toString());
`,

  'ripemd160.ts': `// RIPEMD-160: Hash function
import { hash, hashString } from 'voltaire/crypto/Ripemd160';
import { Hex } from 'voltaire/primitives/Hex';

// Hash a string
const stringHash = hashString('Test data');
console.log('RIPEMD-160 hash:', Hex.from(stringHash).toString());
console.log('Hash length:', stringHash.length, 'bytes');

// Hash bytes
const bytes = new Uint8Array([1, 2, 3, 4]);
const bytesHash = hash(bytes);
console.log('Bytes hash:', Hex.from(bytesHash).toString());
`,

  'secp256k1-keys.ts': `// Secp256k1: Elliptic curve operations
import { Secp256k1 } from 'voltaire/crypto/Secp256k1';
import { Hex } from 'voltaire/primitives/Hex';

// Generate random private key
const privateKey = Secp256k1.PrivateKey.random();
console.log('Private key:', Hex.from(privateKey).toString().slice(0, 20) + '...');

// Get public key
const publicKey = Secp256k1.PrivateKey.toPublicKey(privateKey);
console.log('Public key length:', publicKey.length, 'bytes');

// Verify it's valid
const isValid = Secp256k1.PublicKey.isValid(publicKey);
console.log('Public key valid:', isValid);
`,

  'secp256k1-sign.ts': `// Secp256k1: Signing and verification
import { Secp256k1 } from 'voltaire/crypto/Secp256k1';
import { Keccak256 } from 'voltaire/crypto/Keccak256';
import { Hex } from 'voltaire/primitives/Hex';

// Create message hash
const message = Hex.fromString('Sign this message');
const messageHash = Keccak256.hash(message);

// Generate key and sign
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign({ hash: messageHash, privateKey });

console.log('Signature r length:', signature.r.length);
console.log('Signature s length:', signature.s.length);
console.log('Recovery ID:', signature.recovery);

// Verify signature
const publicKey = Secp256k1.PrivateKey.toPublicKey(privateKey);
const isValid = Secp256k1.verify({ hash: messageHash, signature, publicKey });
console.log('Signature valid:', isValid);
`,

  'hdwallet-basic.ts': `// HD Wallet: Hierarchical Deterministic wallets
import { HDWallet } from 'voltaire/crypto/HDWallet';

// Generate mnemonic
const mnemonic = HDWallet.generateMnemonic();
console.log('Mnemonic words:', mnemonic.split(' ').length);
console.log('First 3 words:', mnemonic.split(' ').slice(0, 3).join(' '));

// Validate mnemonic
const isValid = HDWallet.validateMnemonic(mnemonic);
console.log('Mnemonic valid:', isValid);

// Test invalid mnemonic
const invalid = HDWallet.validateMnemonic('invalid words here');
console.log('Invalid mnemonic rejected:', !invalid);
`,

  'hdwallet-seed.ts': `// HD Wallet: Seed generation
import { HDWallet } from 'voltaire/crypto/HDWallet';
import { Hex } from 'voltaire/primitives/Hex';

// Generate mnemonic and seed
const mnemonic = HDWallet.generateMnemonic();
const seed = HDWallet.mnemonicToSeed(mnemonic);

console.log('Seed length:', seed.length, 'bytes');
console.log('Seed (first 16 bytes):', Hex.from(seed.slice(0, 16)).toString());

// Seed with passphrase
const seedWithPass = HDWallet.mnemonicToSeed(mnemonic, 'my-passphrase');
console.log('Different from no passphrase:', !seed.every((b, i) => b === seedWithPass[i]));
`,
};
