export const cryptoExamples = {
	"keccak256.ts": `// Keccak256: Ethereum's primary hash function
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

	"sha256/hash-string.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Hash string data with SHA256
const message = 'Hello, World!';
const hash = SHA256.hashString(message);
console.log('Original message:', message);
console.log('SHA256 hash:', Hex.fromBytes(hash));
console.log('Hash length:', hash.length, 'bytes (always 32)');

// Hash UTF-8 strings with unicode
const unicode = SHA256.hashString('Hello 世界 🌍');
console.log('\\nUnicode hash:', Hex.fromBytes(unicode));

// Empty string has known hash
const empty = SHA256.hashString('');
console.log('\\nEmpty string hash:', Hex.fromBytes(empty));

// Official test vectors
const abc = SHA256.hashString('abc');
console.log('\\n"abc" hash:', Hex.fromBytes(abc));
`,

	"sha256/hash-bytes.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Hash raw byte arrays
const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
const hash = SHA256.hash(bytes);

console.log('Input bytes:', Array.from(bytes));
console.log('Hash (hex):', Hex.fromBytes(hash));
console.log('Hash length:', hash.length, 'bytes');

// Hash larger byte array
const data = new Uint8Array(100).fill(0x42);
const dataHash = SHA256.hash(data);
console.log('\\nLarge data (100 bytes of 0x42)');
console.log('Hash:', Hex.fromBytes(dataHash));

// Hashing is deterministic
const hash2 = SHA256.hash(bytes);
const match = hash.every((byte, i) => byte === hash2[i]);
console.log('\\nDeterministic:', match);
`,

	"sha256/hash-hex.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Hash hex string data with SHA256
const hexData = '0xdeadbeef';
const hash = SHA256.hashHex(hexData);

console.log('Input hex:', hexData);
console.log('SHA256 hash:', Hex.fromBytes(hash));
console.log('Hash length:', hash.length, 'bytes');

// Works without 0x prefix
const noPrefixHash = SHA256.hashHex('cafebabe');
console.log('\\nWithout 0x prefix:');
console.log('Hash:', Hex.fromBytes(noPrefixHash));

// fromHex() alias
const aliasHash = SHA256.fromHex(hexData);
console.log('\\nfromHex() alias matches:', hash.every((b, i) => b === aliasHash[i]));
`,

	"sha256/double-hash.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Double SHA256 (Bitcoin-style: SHA256(SHA256(data)))
const message = 'Bitcoin uses double SHA256';
console.log('Original message:', message);

const hash1 = SHA256.hashString(message);
console.log('\\nFirst SHA256:', Hex.fromBytes(hash1));

const hash2 = SHA256.hash(hash1);
console.log('Second SHA256:', Hex.fromBytes(hash2));

// Helper function for double SHA256
function doubleSha256(data: Uint8Array): Uint8Array {
  return SHA256.hash(SHA256.hash(data));
}

// Bitcoin example: Block header structure
const blockHeader = new Uint8Array(80).fill(0x00);
const blockHash = doubleSha256(blockHeader);
console.log('\\nBlock header hash:', Hex.fromBytes(blockHash));
`,

	"sha256/hmac.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// HMAC-SHA256: Hash-based Message Authentication Code
function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let k = key;
  if (k.length > blockSize) k = SHA256.hash(k);
  if (k.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(k);
    k = padded;
  }

  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = k[i] ^ 0x36;
    opad[i] = k[i] ^ 0x5c;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(ipad);
  innerMsg.set(message, blockSize);
  const innerHash = SHA256.hash(innerMsg);

  const outerMsg = new Uint8Array(blockSize + 32);
  outerMsg.set(opad);
  outerMsg.set(innerHash, blockSize);
  return SHA256.hash(outerMsg);
}

const key = new TextEncoder().encode('secret-key');
const message = new TextEncoder().encode('Important message');
const mac = hmacSha256(key, message);
console.log('HMAC-SHA256:', Hex.fromBytes(mac));
`,

	"sha256/merkle-tree.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

function merkleRoot(leaves: Uint8Array[]): Uint8Array {
  if (leaves.length === 0) throw new Error('No leaves');
  if (leaves.length === 1) return SHA256.hash(leaves[0]);

  const hashes = leaves.map(leaf => SHA256.hash(leaf));
  while (hashes.length > 1) {
    const nextLevel: Uint8Array[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      const combined = new Uint8Array(64);
      combined.set(left, 0);
      combined.set(right, 32);
      nextLevel.push(SHA256.hash(combined));
    }
    hashes.length = 0;
    hashes.push(...nextLevel);
  }
  return hashes[0];
}

const tx1 = new TextEncoder().encode('Alice sends 10 ETH to Bob');
const tx2 = new TextEncoder().encode('Bob sends 5 ETH to Charlie');
const leaves = [tx1, tx2];
console.log('Merkle root:', Hex.fromBytes(merkleRoot(leaves)));
`,

	"sha256/incremental-hash.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Incremental hashing for streaming data
const hasher = SHA256.create();
console.log('Created incremental hasher\\n');

const chunk1 = new TextEncoder().encode('Hello, ');
const chunk2 = new TextEncoder().encode('World!');

console.log('Adding chunks:');
hasher.update(chunk1);
hasher.update(chunk2);

const hash = hasher.digest();
console.log('Final hash:', Hex.fromBytes(hash));

const oneShot = SHA256.hashString('Hello, World!');
const matches = hash.every((b, i) => b === oneShot[i]);
console.log('Matches one-shot:', matches);
`,

	"sha256/constructor-pattern.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

console.log('SHA256 Constructor Patterns:\\n');

const fromBytes = SHA256.from(new Uint8Array([1, 2, 3]));
console.log('from(Uint8Array):', Hex.fromBytes(fromBytes));

const fromString = SHA256.fromString('Hello, World!');
console.log('fromString():', Hex.fromBytes(fromString));

const fromHex = SHA256.fromHex('0xdeadbeef');
console.log('fromHex():', Hex.fromBytes(fromHex));

console.log('\\nConstants:');
console.log('OUTPUT_SIZE:', SHA256.OUTPUT_SIZE, 'bytes');
console.log('BLOCK_SIZE:', SHA256.BLOCK_SIZE, 'bytes');
`,

	"sha256/test-vectors.ts": `import * as SHA256 from '../../../crypto/SHA256/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

console.log('SHA256 FIPS 180-4 Test Vectors:\\n');

const empty = SHA256.hash(new Uint8Array(0));
const emptyExpected = '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
console.log('Empty input:');
console.log('Output:', Hex.fromBytes(empty));
console.log('Expected:', emptyExpected);
console.log('Match:', Hex.fromBytes(empty) === emptyExpected);

const abc = new Uint8Array([0x61, 0x62, 0x63]);
const abcHash = SHA256.hash(abc);
const abcExpected = '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
console.log('\\n"abc":');
console.log('Output:', Hex.fromBytes(abcHash));
console.log('Expected:', abcExpected);
console.log('Match:', Hex.fromBytes(abcHash) === abcExpected);
`,

	"blake2/basic-hash.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Hash string data with Blake2b (default 64-byte output)
const message = 'Hello, Ethereum!';
const hash = Blake2.hashString(message);

console.log('Input:', message);
console.log('Hash (hex):', Hex.fromBytes(hash));
console.log('Hash length:', hash.length, 'bytes (default 64)');
console.log('Hash type:', hash.constructor.name);

// Hash empty string
const emptyHash = Blake2.hashString('');
console.log('\\nEmpty hash:', Hex.fromBytes(emptyHash));

// Hash with default constructor
const constructorHash = Blake2.hash('Hello, Ethereum!');
console.log('\\nHashes match:', Hex.fromBytes(hash) === Hex.fromBytes(constructorHash));
`,

	"blake2/hash-bytes.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Hash raw byte arrays
const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
const hash = Blake2.hash(bytes);

console.log('Input bytes:', Array.from(bytes));
console.log('Hash (hex):', Hex.fromBytes(hash));
console.log('Hash length:', hash.length, 'bytes');

// Hash larger byte array
const data = new Uint8Array(100).fill(0x42);
const dataHash = Blake2.hash(data);
console.log('\\nLarge data (100 bytes of 0x42)');
console.log('Hash:', Hex.fromBytes(dataHash));

// Hashing is deterministic
const hash2 = Blake2.hash(bytes);
const match = hash.every((byte, i) => byte === hash2[i]);
console.log('\\nDeterministic:', match);
`,

	"blake2/variable-length.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

const message = 'Voltaire';

// Blake2b supports variable output length (1-64 bytes)
console.log('Blake2b Variable Output Lengths:\\n');

// 20 bytes (address-sized, 160 bits)
const hash20 = Blake2.hash(message, 20);
console.log('20-byte hash:', Hex.fromBytes(hash20));
console.log('Length:', hash20.length, 'bytes');

// 32 bytes (SHA-256 equivalent, 256 bits)
const hash32 = Blake2.hash(message, 32);
console.log('\\n32-byte hash:', Hex.fromBytes(hash32));
console.log('Length:', hash32.length, 'bytes');

// 48 bytes (384 bits)
const hash48 = Blake2.hash(message, 48);
console.log('\\n48-byte hash:', Hex.fromBytes(hash48));
console.log('Length:', hash48.length, 'bytes');

// 64 bytes (default, 512 bits - maximum security)
const hash64 = Blake2.hash(message, 64);
console.log('\\n64-byte hash:', Hex.fromBytes(hash64));
console.log('Length:', hash64.length, 'bytes');

// Each length produces completely different hash (not truncation)
console.log('\\nDifferent lengths produce different hashes:');
console.log('32-byte != 64-byte truncated:',
  Hex.fromBytes(hash32) !== Hex.fromBytes(hash64.slice(0, 32)));
`,

	"blake2/fast-checksums.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Blake2b is optimized for speed - ideal for checksums

// Fast 16-byte checksum for data deduplication
function fastChecksum(data: Uint8Array): Uint8Array {
  return Blake2.hash(data, 16);
}

// 32-byte cryptographic checksum (SHA-256 equivalent security)
function cryptoChecksum(data: Uint8Array): Uint8Array {
  return Blake2.hash(data, 32);
}

const file1 = new Uint8Array(1024).fill(0x41); // 1KB of 'A'
const file2 = new Uint8Array(1024).fill(0x42); // 1KB of 'B'

console.log('Fast Checksums:\\n');

const checksum1 = fastChecksum(file1);
console.log('File 1 (16-byte):', Hex.fromBytes(checksum1));

const checksum2 = fastChecksum(file2);
console.log('File 2 (16-byte):', Hex.fromBytes(checksum2));

console.log('\\nCryptographic Checksums:\\n');

const crypto1 = cryptoChecksum(file1);
console.log('File 1 (32-byte):', Hex.fromBytes(crypto1));

const crypto2 = cryptoChecksum(file2);
console.log('File 2 (32-byte):', Hex.fromBytes(crypto2));

// Different files produce different checksums
console.log('\\nChecksums differ:',
  Hex.fromBytes(checksum1) !== Hex.fromBytes(checksum2));
`,

	"blake2/content-addressing.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Content addressing (IPFS-style) using Blake2b

function contentAddress(data: Uint8Array): string {
  // Use 32-byte hash for content addressing
  const hash = Blake2.hash(data, 32);
  return Hex.fromBytes(hash);
}

// Example: Address some content
const content1 = new TextEncoder().encode('First piece of content');
const content2 = new TextEncoder().encode('Second piece of content');
const content3 = new TextEncoder().encode('First piece of content'); // Same as content1

console.log('Content Addressing:\\n');

const addr1 = contentAddress(content1);
console.log('Content 1:', addr1);

const addr2 = contentAddress(content2);
console.log('Content 2:', addr2);

const addr3 = contentAddress(content3);
console.log('Content 3:', addr3);

console.log('\\nSame content = same address:', addr1 === addr3);
console.log('Different content = different address:', addr1 !== addr2);

// Build a simple content store
const contentStore = new Map<string, Uint8Array>();

function store(data: Uint8Array): string {
  const address = contentAddress(data);
  contentStore.set(address, data);
  return address;
}

function retrieve(address: string): Uint8Array | undefined {
  return contentStore.get(address);
}

console.log('\\nContent Store Example:');
const key = store(content1);
console.log('Stored with address:', key.slice(0, 20) + '...');
const retrieved = retrieve(key);
console.log('Retrieved successfully:', retrieved !== undefined);
`,

	"blake2/merkle-tree.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// Build Merkle tree using Blake2b for fast hashing

function merkleRoot(leaves: Uint8Array[], outputSize: number = 32): Uint8Array {
  if (leaves.length === 0) throw new Error('No leaves');
  if (leaves.length === 1) return Blake2.hash(leaves[0], outputSize);

  // Hash all leaves
  const hashes = leaves.map(leaf => Blake2.hash(leaf, outputSize));

  // Build tree bottom-up
  while (hashes.length > 1) {
    const nextLevel: Uint8Array[] = [];

    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left; // Duplicate last if odd

      // Concatenate and hash
      const combined = new Uint8Array(outputSize * 2);
      combined.set(left, 0);
      combined.set(right, outputSize);
      nextLevel.push(Blake2.hash(combined, outputSize));
    }

    hashes.length = 0;
    hashes.push(...nextLevel);
  }

  return hashes[0];
}

// Example: Build Merkle tree from transactions
const tx1 = new TextEncoder().encode('Alice sends 10 ETH to Bob');
const tx2 = new TextEncoder().encode('Bob sends 5 ETH to Charlie');
const tx3 = new TextEncoder().encode('Charlie sends 2 ETH to Dave');
const tx4 = new TextEncoder().encode('Dave sends 1 ETH to Eve');

const leaves = [tx1, tx2, tx3, tx4];

console.log('Merkle Tree with Blake2b:\\n');
console.log('Leaves:', leaves.length);

const root = merkleRoot(leaves, 32);
console.log('Root (32-byte):', Hex.fromBytes(root));

// Different output sizes
const root20 = merkleRoot(leaves, 20);
console.log('Root (20-byte):', Hex.fromBytes(root20));

const root64 = merkleRoot(leaves, 64);
console.log('Root (64-byte):', Hex.fromBytes(root64).slice(0, 60) + '...');

// Adding a leaf changes the root
const txExtra = new TextEncoder().encode('Eve sends 0.5 ETH to Frank');
const leavesWithExtra = [...leaves, txExtra];
const newRoot = merkleRoot(leavesWithExtra, 32);

console.log('\\nRoot changes with new leaf:', Hex.fromBytes(root) !== Hex.fromBytes(newRoot));
`,

	"blake2/test-vectors.ts": `import * as Blake2 from '../../../crypto/Blake2/index.js';
import * as Hex from '../../../primitives/Hex/index.js';

// RFC 7693 test vectors for Blake2b

console.log('Blake2b RFC 7693 Test Vectors:\\n');

// Empty input (64-byte output)
const emptyHash = Blake2.hash(new Uint8Array(0), 64);
const emptyExpected = new Uint8Array([
  0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03,
  0xc6, 0xc6, 0xfd, 0x85, 0x25, 0x52, 0xd2, 0x72,
  0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
  0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19,
  0xd2, 0x5e, 0x10, 0x31, 0xaf, 0xee, 0x58, 0x53,
  0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
  0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55,
  0xd5, 0x6f, 0x70, 0x1a, 0xfe, 0x9b, 0xe2, 0xce,
]);

console.log('Empty input (64 bytes):');
console.log('Output:', Hex.fromBytes(emptyHash));
console.log('Match:', emptyHash.every((b, i) => b === emptyExpected[i]));

// "abc" (64-byte output)
const abc = new Uint8Array([0x61, 0x62, 0x63]);
const abcHash = Blake2.hash(abc, 64);
const abcExpected = new Uint8Array([
  0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d,
  0x6a, 0x27, 0x97, 0xb6, 0x9f, 0x12, 0xf6, 0xe9,
  0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
  0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1,
  0x7d, 0x87, 0xc5, 0x39, 0x2a, 0xab, 0x79, 0x2d,
  0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
  0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a,
  0xb9, 0x23, 0x86, 0xed, 0xd4, 0x00, 0x99, 0x23,
]);

console.log('\\n"abc" (64 bytes):');
console.log('Output:', Hex.fromBytes(abcHash));
console.log('Match:', abcHash.every((b, i) => b === abcExpected[i]));

// Empty input (32-byte output, Blake2b-256)
const empty32 = Blake2.hash(new Uint8Array(0), 32);
const empty32Expected = new Uint8Array([
  0x0e, 0x57, 0x51, 0xc0, 0x26, 0xe5, 0x43, 0xb2,
  0xe8, 0xab, 0x2e, 0xb0, 0x60, 0x99, 0xda, 0xa1,
  0xd1, 0xe5, 0xdf, 0x47, 0x77, 0x8f, 0x77, 0x87,
  0xfa, 0xab, 0x45, 0xcd, 0xf1, 0x2f, 0xe3, 0xa8,
]);

console.log('\\nEmpty input (32 bytes, Blake2b-256):');
console.log('Output:', Hex.fromBytes(empty32));
console.log('Match:', empty32.every((b, i) => b === empty32Expected[i]));

// Single byte 0x00
const zero = new Uint8Array([0x00]);
const zeroHash = Blake2.hash(zero, 64);

console.log('\\nSingle byte 0x00 (64 bytes):');
console.log('Output:', Hex.fromBytes(zeroHash).slice(0, 60) + '...');

// Two bytes 0x00 0x01
const twoBytes = new Uint8Array([0x00, 0x01]);
const twoBytesHash = Blake2.hash(twoBytes, 64);

console.log('\\nTwo bytes 0x00 0x01 (64 bytes):');
console.log('Output:', Hex.fromBytes(twoBytesHash).slice(0, 60) + '...');
`,

	// RIPEMD160 Examples
	"ripemd160/hash-string.ts": `import * as RIPEMD160 from 'voltaire/crypto/RIPEMD160';
import * as Hex from 'voltaire/primitives/Hex';

// Hash string data with RIPEMD160
const message = "Hello, Bitcoin!";
const hash = RIPEMD160.hashString(message);
console.log("Original message:", message);
console.log("RIPEMD160 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes (always 20)");

// Hash UTF-8 strings with unicode
const unicode = RIPEMD160.hashString("Hello 世界 🌍");
console.log("\\nUnicode hash:", Hex.fromBytes(unicode));

// Empty string has known hash
const empty = RIPEMD160.hashString("");
console.log("\\nEmpty string hash:", Hex.fromBytes(empty));

// Official test vectors
const abc = RIPEMD160.hashString("abc");
console.log("\\n'abc' hash:", Hex.fromBytes(abc));
// Expected: 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
`,

	"ripemd160/hash-bytes.ts": `import * as RIPEMD160 from 'voltaire/crypto/RIPEMD160';
import * as Hex from 'voltaire/primitives/Hex';

// Hash raw byte arrays
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = RIPEMD160.hash(data);
console.log("Data bytes:", Array.from(data));
console.log("RIPEMD160 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes");

// Hash accepts string or Uint8Array
const fromString = RIPEMD160.hash("test");
console.log("\\nHash from string:", Hex.fromBytes(fromString));

// Large data
const largeData = new Uint8Array(1000).fill(0xaa);
const largeHash = RIPEMD160.hash(largeData);
console.log("\\nLarge data hash:", Hex.fromBytes(largeHash));

// Binary data with all byte values
const allBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  allBytes[i] = i;
}
const allBytesHash = RIPEMD160.hash(allBytes);
console.log("\\nAll bytes 0-255 hash:", Hex.fromBytes(allBytesHash));
`,

	"ripemd160/hash-hex.ts": `import * as RIPEMD160 from 'voltaire/crypto/RIPEMD160';
import * as Hex from 'voltaire/primitives/Hex';

// Hash hex strings directly
const hexData = "0xdeadbeef";
const hash = RIPEMD160.hashHex(hexData);
console.log("Hex input:", hexData);
console.log("RIPEMD160 hash:", Hex.fromBytes(hash));

// Works with or without 0x prefix
const withoutPrefix = RIPEMD160.hashHex("cafebabe");
console.log("\\nWithout 0x prefix:", Hex.fromBytes(withoutPrefix));

// Hash public key hex
const pubKeyHex = "0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
const pubKeyHash = RIPEMD160.hashHex(pubKeyHex);
console.log("\\nPublic key hex hash:", Hex.fromBytes(pubKeyHash));

// Empty hex
const emptyHash = RIPEMD160.hashHex("0x");
console.log("\\nEmpty hex hash:", Hex.fromBytes(emptyHash));
`,

	"ripemd160/bitcoin-address.ts": `import * as RIPEMD160 from 'voltaire/crypto/RIPEMD160';
import * as SHA256 from 'voltaire/crypto/SHA256';
import * as Hex from 'voltaire/primitives/Hex';

// Bitcoin uses SHA256 + RIPEMD160 for address generation (hash160)
console.log("=== Bitcoin Address Derivation (Simplified) ===\\n");

// Example: Uncompressed public key
const uncompressedPubKey = Hex.fromString(
  "04" +
    "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" +
    "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
);

// Step 1: SHA256 hash of public key
const sha256Hash = SHA256.hash(uncompressedPubKey);
console.log("Public key (first 20 bytes):", Hex.fromBytes(uncompressedPubKey.slice(0, 20)));
console.log("SHA256 hash:", Hex.fromBytes(sha256Hash));

// Step 2: RIPEMD160 hash of SHA256 result (hash160)
const hash160 = RIPEMD160.hash(sha256Hash);
console.log("RIPEMD160 hash (hash160):", Hex.fromBytes(hash160));
console.log("Hash160 length:", hash160.length, "bytes");

// This hash160 would then be Base58Check encoded with version byte
// for the final Bitcoin address (not shown)

console.log("\\n=== Compressed Public Key ===\\n");

// Compressed public key (33 bytes, starts with 02 or 03)
const compressedPubKey = Hex.fromString(
  "02" + "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
);

const compressedSha = SHA256.hash(compressedPubKey);
const compressedHash160 = RIPEMD160.hash(compressedSha);
console.log("Compressed pubkey:", Hex.fromBytes(compressedPubKey));
console.log("Hash160:", Hex.fromBytes(compressedHash160));

// Compressed vs uncompressed give different addresses
console.log("\\nDifferent hash160:", !hash160.equals(compressedHash160));
`,

	"ripemd160/constructor-pattern.ts": `import * as RIPEMD160 from 'voltaire/crypto/RIPEMD160';
import * as Hex from 'voltaire/primitives/Hex';

// Constructor pattern - auto-detects input type
console.log("=== Constructor Pattern (RIPEMD160.from) ===\\n");

// From string
const stringHash = RIPEMD160.from("hello");
console.log("From string 'hello':", Hex.fromBytes(stringHash));

// From Uint8Array
const bytes = new Uint8Array([1, 2, 3]);
const bytesHash = RIPEMD160.from(bytes);
console.log("From bytes [1,2,3]:", Hex.fromBytes(bytesHash));

// Equivalent to specific methods
const hashStringResult = RIPEMD160.hashString("hello");
const hashResult = RIPEMD160.hash(bytes);

console.log("\\nConstructor matches hashString:", stringHash.equals(hashStringResult));
console.log("Constructor matches hash:", bytesHash.equals(hashResult));

console.log("\\n=== Legacy API vs New API ===\\n");

// Legacy method names
const legacy1 = RIPEMD160.hash("test");
const legacy2 = RIPEMD160.hashString("test");

// New constructor names
const new1 = RIPEMD160.from("test");
const new2 = RIPEMD160.fromString("test");

console.log("All methods produce same result:");
console.log("hash():", Hex.fromBytes(legacy1));
console.log("hashString():", Hex.fromBytes(legacy2));
console.log("from():", Hex.fromBytes(new1));
console.log("fromString():", Hex.fromBytes(new2));
console.log("\\nAll equal:", legacy1.equals(new1) && legacy2.equals(new2));
`,

	"secp256k1-keys.ts": `// Secp256k1: Elliptic curve operations
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

	"secp256k1-sign.ts": `// Secp256k1: Signing and verification
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

	"hdwallet-basic.ts": `// HD Wallet: Hierarchical Deterministic wallets
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

	"hdwallet-seed.ts": `// HD Wallet: Seed generation
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

	"bip39/generate-mnemonic.ts": `// Generate BIP-39 mnemonic phrases
import * as Bip39 from 'voltaire/crypto/BIP39';

// Generate 12-word mnemonic (128-bit entropy)
const mnemonic12 = Bip39.generateMnemonic(128);
console.log('12-word mnemonic:', mnemonic12);
console.log('Word count:', mnemonic12.split(' ').length);

// Generate 24-word mnemonic (256-bit recommended)
const mnemonic24 = Bip39.generateMnemonic(256);
console.log('\\n24-word mnemonic:', mnemonic24);

// Default generates 24 words
const mnemonicDefault = Bip39.generateMnemonic();
console.log('\\nDefault words:', mnemonicDefault.split(' ').length);

// Each generation is unique
const m1 = Bip39.generateMnemonic(256);
const m2 = Bip39.generateMnemonic(256);
console.log('Unique:', m1 !== m2);
`,

	"bip39/validate-mnemonic.ts": `// Validate BIP-39 mnemonic phrases
import * as Bip39 from 'voltaire/crypto/BIP39';

// Valid test vector
const valid = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
console.log('Valid mnemonic:', Bip39.validateMnemonic(valid));

// Invalid checksum
const invalid = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
console.log('Invalid checksum:', Bip39.validateMnemonic(invalid));

// Invalid word
const badWord = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon notaword';
console.log('Invalid word:', Bip39.validateMnemonic(badWord));

// Generate and validate
const generated = Bip39.generateMnemonic(256);
console.log('\\nGenerated valid:', Bip39.validateMnemonic(generated));

// assertValidMnemonic throws
try {
  Bip39.assertValidMnemonic(invalid);
} catch (error) {
  console.log('Throws on invalid:', error.message);
}
`,

	"bip39/mnemonic-to-seed.ts": `// Convert mnemonic to seed using PBKDF2
import * as Bip39 from 'voltaire/crypto/BIP39';
import * as Hex from 'voltaire/primitives/Hex';

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Derive seed (async)
const seed = await Bip39.mnemonicToSeed(mnemonic);
console.log('Seed length:', seed.length, 'bytes');
console.log('Seed (hex):', Hex.fromBytes(seed).toString().slice(0, 32) + '...');

// With passphrase
const seedPass = await Bip39.mnemonicToSeed(mnemonic, 'TREZOR');
console.log('\\nWith passphrase:', Hex.fromBytes(seedPass).toString().slice(0, 32) + '...');

// Different passphrases = different seeds
const s1 = await Bip39.mnemonicToSeed(mnemonic, 'pass1');
const s2 = await Bip39.mnemonicToSeed(mnemonic, 'pass2');
console.log('Different seeds:', Hex.fromBytes(s1).toString() !== Hex.fromBytes(s2).toString());

// Deterministic
const a = await Bip39.mnemonicToSeed(mnemonic, 'test');
const b = await Bip39.mnemonicToSeed(mnemonic, 'test');
console.log('Deterministic:', Hex.fromBytes(a).toString() === Hex.fromBytes(b).toString());
`,

	"bip39/entropy-to-mnemonic.ts": `// Convert entropy to mnemonic
import * as Bip39 from 'voltaire/crypto/BIP39';
import * as Hex from 'voltaire/primitives/Hex';

// 16 bytes (128 bits) = 12 words
const entropy16 = new Uint8Array(16).fill(0);
const m12 = Bip39.entropyToMnemonic(entropy16);
console.log('16 bytes → 12 words:', m12.split(' ').length);
console.log('Mnemonic:', m12);

// 32 bytes (256 bits) = 24 words
const entropy32 = new Uint8Array(32).fill(0);
const m24 = Bip39.entropyToMnemonic(entropy32);
console.log('\\n32 bytes → 24 words:', m24.split(' ').length);

// Random entropy
const random = new Uint8Array(32);
crypto.getRandomValues(random);
const randomM = Bip39.entropyToMnemonic(random);
console.log('\\nRandom valid:', Bip39.validateMnemonic(randomM));
console.log('Entropy (hex):', Hex.fromBytes(random).toString().slice(0, 32) + '...');

// Deterministic
const test = new Uint8Array(16).fill(0x42);
const m1 = Bip39.entropyToMnemonic(test);
const m2 = Bip39.entropyToMnemonic(test);
console.log('Deterministic:', m1 === m2);
`,

	"bip39/sync-derivation.ts": `// Synchronous seed derivation
import * as Bip39 from 'voltaire/crypto/BIP39';
import * as Hex from 'voltaire/primitives/Hex';

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Synchronous derivation
const seedSync = Bip39.mnemonicToSeedSync(mnemonic);
console.log('Sync seed length:', seedSync.length, 'bytes');
console.log('Sync seed (hex):', Hex.fromBytes(seedSync).toString().slice(0, 32) + '...');

// With passphrase
const seedSyncPass = Bip39.mnemonicToSeedSync(mnemonic, 'TREZOR');
console.log('\\nWith passphrase (hex):', Hex.fromBytes(seedSyncPass).toString().slice(0, 32) + '...');

// Sync matches async
const seedAsync = await Bip39.mnemonicToSeed(mnemonic);
const match = seedSync.every((byte, i) => byte === seedAsync[i]);
console.log('\\nSync matches async:', match);

// Deterministic
const s1 = Bip39.mnemonicToSeedSync(mnemonic, 'password');
const s2 = Bip39.mnemonicToSeedSync(mnemonic, 'password');
console.log('Deterministic:', Hex.fromBytes(s1).toString() === Hex.fromBytes(s2).toString());
`,

	"bip39/passphrase.ts": `// Optional passphrase for plausible deniability
import * as Bip39 from 'voltaire/crypto/BIP39';
import * as Hex from 'voltaire/primitives/Hex';

const mnemonic = Bip39.generateMnemonic(256);
console.log('Generated 24-word mnemonic');

// Same mnemonic, different passphrases = different wallets
const decoy = await Bip39.mnemonicToSeed(mnemonic, 'decoy-wallet');
const real = await Bip39.mnemonicToSeed(mnemonic, 'real-wallet');
const none = await Bip39.mnemonicToSeed(mnemonic);

console.log('\\nDecoy:', Hex.fromBytes(decoy).toString().slice(0, 32) + '...');
console.log('Real:', Hex.fromBytes(real).toString().slice(0, 32) + '...');
console.log('No pass:', Hex.fromBytes(none).toString().slice(0, 32) + '...');

// All different
console.log('\\nAll unique:',
  Hex.fromBytes(decoy).toString() !== Hex.fromBytes(real).toString() &&
  Hex.fromBytes(real).toString() !== Hex.fromBytes(none).toString()
);

// Unicode passphrase
const unicode = await Bip39.mnemonicToSeed(mnemonic, '密码🔑');
console.log('Unicode supported:', unicode.length === 64);
`,

	"bip39/utilities.ts": `// BIP-39 utility functions
import * as Bip39 from 'voltaire/crypto/BIP39';

// Word count from entropy bits
console.log('Word count:');
console.log('128 bits →', Bip39.getWordCount(128), 'words');
console.log('256 bits →', Bip39.getWordCount(256), 'words');

// Entropy bits from word count
console.log('\\nEntropy bits:');
console.log('12 words →', Bip39.getEntropyBits(12), 'bits');
console.log('24 words →', Bip39.getEntropyBits(24), 'bits');

// Constants
console.log('\\nConstants:');
console.log('ENTROPY_128:', Bip39.ENTROPY_128);
console.log('ENTROPY_256:', Bip39.ENTROPY_256);
console.log('SEED_LENGTH:', Bip39.SEED_LENGTH);

// Round-trip conversion
const entropy = Bip39.ENTROPY_256;
const words = Bip39.getWordCount(entropy);
const back = Bip39.getEntropyBits(words);
console.log('\\nRound-trip:', entropy, '→', words, '→', back);
console.log('Accurate:', entropy === back);
`,

	"bip39/full-workflow.ts": `// Complete BIP-39 wallet workflow
import * as Bip39 from 'voltaire/crypto/BIP39';
import * as Hex from 'voltaire/primitives/Hex';

console.log('=== BIP-39 Wallet Creation Workflow ===\\n');

// Step 1: Generate mnemonic
console.log('1. Generate 24-word mnemonic');
const mnemonic = Bip39.generateMnemonic(256);
const words = mnemonic.split(' ');
console.log('First 3 words:', words.slice(0, 3).join(' '));
console.log('Total words:', words.length);

// Step 2: Validate mnemonic
console.log('\\n2. Validate mnemonic');
console.log('Valid:', Bip39.validateMnemonic(mnemonic));

// Step 3: Derive seed with passphrase
console.log('\\n3. Derive seed');
const passphrase = 'my secure passphrase';
const seed = await Bip39.mnemonicToSeed(mnemonic, passphrase);
console.log('Seed length:', seed.length, 'bytes');
console.log('Seed (hex):', Hex.fromBytes(seed).toString().slice(0, 32) + '...');

// Step 4: Recovery test
console.log('\\n4. Wallet recovery test');
const recoveredSeed = await Bip39.mnemonicToSeed(mnemonic, passphrase);
const match = seed.every((byte, i) => byte === recoveredSeed[i]);
console.log('Recovery successful:', match);

// Plausible deniability demo
console.log('\\n=== Plausible Deniability ===');
const decoy = await Bip39.mnemonicToSeed(mnemonic, 'decoy');
const real = await Bip39.mnemonicToSeed(mnemonic, passphrase);
console.log('Different seeds:', Hex.fromBytes(decoy).toString() !== Hex.fromBytes(real).toString());
`,

	// EIP-712 Examples - Lines reference actual files in /playground/src/examples/crypto/eip712/
	"eip712/basic-message.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/basic-message.ts#L1-L47",
	"eip712/sign-verify.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/sign-verify.ts#L1-L59",
	"eip712/nested-structs.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/nested-structs.ts#L1-L70",
	"eip712/encode-values.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/encode-values.ts#L1-L55",
	"eip712/domain-separator.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/domain-separator.ts#L1-L65",
	"eip712/erc2612-permit.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/erc2612-permit.ts#L1-L74",
	"eip712/dex-order.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/dex-order.ts#L1-L83",
	"eip712/dao-vote.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/dao-vote.ts#L1-L76",
	"eip712/meta-transaction.ts":
		"https://github.com/voltaire-network/voltaire/blob/main/playground/src/examples/crypto/eip712/meta-transaction.ts#L1-L82",
};
