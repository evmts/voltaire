export const primitiveExamples = {
	"address-basics.ts": `// Address: Creating and validating Ethereum addresses
import { Address } from 'voltaire/primitives/Address';
import * as Secp256k1 from 'voltaire/crypto/Secp256k1';

// Address extends Uint8Array - can use as bytes directly
const addr = Address('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
console.log('instanceof Uint8Array:', addr instanceof Uint8Array);
console.log('Length:', addr.length, 'bytes');
console.log('First byte:', addr[0]);

// === CREATION METHODS ===
// From various formats
const fromHex = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
const fromBytes = Address.fromBytes(new Uint8Array(20));
const fromNumber = Address.fromNumber(0x742d35n);
const fromBase64 = Address.fromBase64('dC01zGY0wFMpJaO4RLxFTkQ49E4=');
const zero = Address.zero();

// From crypto keys
const privateKey = crypto.getRandomValues(new Uint8Array(32));
const publicKey = Secp256k1.derivePublicKey(privateKey);
const fromPubKey = Address.fromPublicKey(publicKey);
const fromPrivKey = Address.fromPrivateKey(privateKey);

console.log('\\n=== Creation ===');
console.log('From hex:', fromHex.toHex());
console.log('Zero address:', zero.toHex());
console.log('From public key:', fromPubKey.toHex());
console.log('From private key:', fromPrivKey.toHex());
console.log('Keys match:', fromPubKey.equals(fromPrivKey));

// === INSTANCE METHODS: Conversion ===
console.log('\\n=== Conversion Methods ===');
console.log('toHex():', addr.toHex());
console.log('toLowercase():', addr.toLowercase());
console.log('toUppercase():', addr.toUppercase());
console.log('toShortHex():', addr.toShortHex());
console.log('toShortHex(6,4):', addr.toShortHex(6, 4));
console.log('toBytes():', addr.toBytes());
console.log('toU256():', addr.toU256());
console.log('toAbiEncoded():', addr.toAbiEncoded());

// === INSTANCE METHODS: Comparison ===
console.log('\\n=== Comparison Methods ===');
const addr2 = Address('0x742d35cc6634c0532925a3b844bc454e4438f44e');
console.log('equals(addr2):', addr.equals(addr2)); // case insensitive
console.log('compare(addr2):', addr.compare(addr2));
console.log('lessThan(zero):', addr.lessThan(zero));
console.log('greaterThan(zero):', addr.greaterThan(zero));

// === INSTANCE METHODS: Utilities ===
console.log('\\n=== Utility Methods ===');
console.log('isZero():', addr.isZero());
console.log('clone():', addr.clone().toHex());

// === STATIC METHODS ===
console.log('\\n=== Static Validation ===');
console.log('Address.isValid(valid hex):', Address.isValid('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'));
console.log('Address.isValid(invalid):', Address.isValid('0xinvalid'));
console.log('Address.is():', Address.is(addr)); // type guard

// Direct Uint8Array access
console.log('\\n=== Uint8Array Access ===');
console.log('Slice first 4 bytes:', addr.slice(0, 4));
console.log('Iterate bytes:', [...addr.slice(0, 4)]);
`,

	"hex-from-string.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert UTF-8 strings to hex encoding
const message = 'Hello, Ethereum!';
const hex = Hex.fromString(message);
console.log('Original string:', message);
console.log('Hex encoded:', hex);
console.log('Byte size:', Hex.size(hex));

// Emoji and Unicode support
const emoji = Hex.fromString('🚀 Voltaire');
console.log('\\nEmoji hex:', emoji);

// Empty string
const empty = Hex.fromString('');
console.log('\\nEmpty string hex:', empty);
`,

	"hex-from-bytes.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert Uint8Array to hex string
const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
const hex = Hex.fromBytes(bytes);
console.log('Bytes:', bytes);
console.log('Hex:', hex);

// Zero bytes
const zeros = new Uint8Array(32);
const zeroHex = Hex.fromBytes(zeros);
console.log('\\n32 zero bytes:', zeroHex);

// Single byte
const single = Hex.fromBytes(new Uint8Array([0xff]));
console.log('\\nSingle byte (0xff):', single);
`,

	"hex-to-string.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Decode hex to UTF-8 string
const hex = '0x48656c6c6f2c20457468657265756d21';
const decoded = Hex.toString(hex);
console.log('Hex:', hex);
console.log('Decoded string:', decoded);

// Round-trip encoding
const original = 'Voltaire primitives';
const encoded = Hex.fromString(original);
const roundtrip = Hex.toString(encoded);
console.log('\\nOriginal:', original);
console.log('Encoded:', encoded);
console.log('Round-trip:', roundtrip);
console.log('Match:', original === roundtrip);

// Emoji round-trip
const emojiOriginal = '🔥 Fast crypto';
const emojiEncoded = Hex.fromString(emojiOriginal);
const emojiDecoded = Hex.toString(emojiEncoded);
console.log('\\nEmoji original:', emojiOriginal);
console.log('Emoji decoded:', emojiDecoded);
console.log('Match:', emojiOriginal === emojiDecoded);
`,

	"hex-to-bytes.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert hex string to Uint8Array
const hex = Hex.from('0x123456789abcdef0');
const bytes = hex.toBytes();
console.log('Hex:', hex.toString());
console.log('Bytes:', bytes);
console.log('Bytes length:', bytes.length);

// With prefix and without
const withPrefix = Hex.from('0xdeadbeef');
const withoutPrefix = Hex.from('deadbeef');
console.log('\\nWith prefix:', withPrefix.toBytes());
console.log('Without prefix:', withoutPrefix.toBytes());

// Round-trip conversion
const original = new Uint8Array([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = hexString.toBytes();
console.log('\\nOriginal bytes:', original);
console.log('Hex representation:', hexString.toString());
console.log('Restored bytes:', restored);
console.log('Arrays equal:', original.every((b, i) => b === restored[i]));
`,

	"hex-concat.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Concatenate multiple hex strings
const part1 = Hex.from('0x1234');
const part2 = Hex.from('0x5678');
const part3 = Hex.from('0x9abc');

const combined = part1.concat(part2, part3);
console.log('Part 1:', part1.toString());
console.log('Part 2:', part2.toString());
console.log('Part 3:', part3.toString());
console.log('Combined:', combined.toString());
console.log('Combined size:', combined.size(), 'bytes');

// Build complex data structures
const selector = Hex.from('0x70a08231');
const address = Hex.from('0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e');
const calldata = selector.concat(address);
console.log('\\nFunction calldata:', calldata.toString());
console.log('Calldata size:', calldata.size(), 'bytes');
`,

	"hex-slice.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Slice hex strings by byte offsets
const hex = Hex.from('0x123456789abcdef0');
console.log('Original:', hex.toString());
console.log('Size:', hex.size(), 'bytes');

// Extract first 4 bytes
const first4 = hex.slice(0, 4);
console.log('\\nFirst 4 bytes:', first4.toString());

// Extract last 4 bytes
const last4 = hex.slice(4, 8);
console.log('Last 4 bytes:', last4.toString());

// Extract function selector
const calldata = Hex.from('0x70a08231000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e');
const selector = calldata.slice(0, 4);
const params = calldata.slice(4);
console.log('\\nCalldata:', calldata.toString());
console.log('Function selector:', selector.toString());
console.log('Parameters:', params.toString());
`,

	"hex-equals.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Compare hex values for equality
const hex1 = Hex.from('0xdeadbeef');
const hex2 = Hex.from('0xdeadbeef');
const hex3 = Hex.from('0xDEADBEEF');
const hex4 = Hex.from('deadbeef');

console.log('Hex 1:', hex1.toString());
console.log('Hex 2:', hex2.toString());
console.log('hex1 === hex2:', hex1.equals(hex2));

// Case-insensitive comparison
console.log('\\nHex 3 (uppercase):', hex3.toString());
console.log('hex1 === hex3:', hex1.equals(hex3));

// Prefix handling
console.log('\\nHex 4 (no prefix):', hex4.toString());
console.log('hex1 === hex4:', hex1.equals(hex4));

// Different values
const different = Hex.from('0xcafebabe');
console.log('\\nDifferent:', different.toString());
console.log('hex1 === different:', hex1.equals(different));
`,

	"hex-from-number.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert numbers to hex
const num1 = 255;
const hex1 = Hex.fromNumber(num1);
console.log('Number:', num1);
console.log('Hex:', hex1);
console.log('Size:', Hex.size(hex1), 'bytes');

// Larger numbers
const num2 = 1000000;
const hex2 = Hex.fromNumber(num2);
console.log('\\nNumber:', num2);
console.log('Hex:', hex2);

// Fixed size padding
const num3 = 42;
const hex3_32 = Hex.fromNumber(num3, 32);
console.log('\\nNumber:', num3);
console.log('Hex (32 bytes):', hex3_32);
console.log('Size:', Hex.size(hex3_32), 'bytes');

// Zero
const zero = Hex.fromNumber(0);
console.log('\\nZero:', zero);
`,

	"hex-to-number.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert hex to number
const hex1 = '0xff';
const num1 = Hex.toNumber(hex1);
console.log('Hex:', hex1);
console.log('Number:', num1);

// Larger values
const hex2 = '0xf4240';
const num2 = Hex.toNumber(hex2);
console.log('\\nHex:', hex2);
console.log('Number:', num2);

// Round-trip conversion
const original = 12345;
const hexed = Hex.fromNumber(original);
const restored = Hex.toNumber(hexed);
console.log('\\nOriginal number:', original);
console.log('Hex:', hexed);
console.log('Restored:', restored);
console.log('Match:', original === restored);
`,

	"hex-from-bigint.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert BigInt to hex
const bigNum = 2n ** 256n - 1n;
const hex = Hex.fromBigInt(bigNum);
console.log('BigInt:', bigNum.toString());
console.log('Hex:', hex);
console.log('Size:', Hex.size(hex), 'bytes');

// Ethereum amounts
const oneEther = 10n ** 18n;
const etherHex = Hex.fromBigInt(oneEther);
console.log('\\n1 ETH (wei):', oneEther.toString());
console.log('Hex:', etherHex);

// Fixed size
const small = 42n;
const hex32 = Hex.fromBigInt(small, 32);
console.log('\\nSmall BigInt:', small);
console.log('Hex (32 bytes):', hex32);
console.log('Size:', Hex.size(hex32), 'bytes');
`,

	"hex-to-bigint.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert hex to BigInt
const hex1 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const bigInt1 = Hex.toBigInt(hex1);
console.log('Hex:', hex1);
console.log('BigInt:', bigInt1.toString());
console.log('Is max uint256:', bigInt1 === 2n ** 256n - 1n);

// Ethereum amounts
const weiHex = '0x0de0b6b3a7640000';
const wei = Hex.toBigInt(weiHex);
console.log('\\nWei hex:', weiHex);
console.log('Wei:', wei.toString());
console.log('ETH:', Number(wei) / 1e18);

// Round-trip conversion
const original = 123456789012345678901234567890n;
const hexed = Hex.fromBigInt(original);
const restored = Hex.toBigInt(hexed);
console.log('\\nOriginal BigInt:', original.toString());
console.log('Hex:', hexed);
console.log('Restored:', restored.toString());
console.log('Match:', original === restored);
`,

	"hex-pad.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Pad hex to specified size
const hex = '0x1234';
console.log('Original:', hex);
console.log('Size:', Hex.size(hex), 'bytes');

// Pad to 32 bytes
const padded32 = Hex.pad(hex, 32);
console.log('\\nPadded to 32 bytes:', padded32);
console.log('Size:', Hex.size(padded32), 'bytes');

// Right padding
const rightPadded = Hex.padRight(hex, 32);
console.log('\\nRight padded to 32 bytes:', rightPadded);
console.log('Size:', Hex.size(rightPadded), 'bytes');

// Address padding
const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const addressPadded = Hex.pad(address, 32);
console.log('\\nAddress:', address);
console.log('Padded to 32 bytes:', addressPadded);
`,

	"hex-trim.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Remove leading zeros
const padded = '0x000000000000000000000000000000000000000000000000000000000000002a';
const trimmed = Hex.trim(padded);
console.log('Padded:', padded);
console.log('Trimmed:', trimmed);
console.log('Padded size:', Hex.size(padded), 'bytes');
console.log('Trimmed size:', Hex.size(trimmed), 'bytes');

// Trim address
const paddedAddress = '0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e';
const address = Hex.trim(paddedAddress);
console.log('\\nPadded address:', paddedAddress);
console.log('Trimmed address:', address);

// Round-trip pad and trim
const original = '0x1234';
const padded32 = Hex.pad(original, 32);
const restored = Hex.trim(padded32);
console.log('\\nOriginal:', original);
console.log('Padded:', padded32);
console.log('Restored:', restored);
console.log('Match:', original === restored);
`,

	"hex-xor.ts": `import * as Hex from 'voltaire/primitives/Hex';

// XOR two hex values
const hex1 = '0xff00ff00';
const hex2 = '0x00ff00ff';
const result = Hex.xor(hex1, hex2);
console.log('Hex 1:', hex1);
console.log('Hex 2:', hex2);
console.log('XOR result:', result);

// XOR with all zeros (identity)
const data = '0xdeadbeef';
const zeros = '0x00000000';
const identity = Hex.xor(data, zeros);
console.log('\\nData:', data);
console.log('XOR with zeros:', identity);
console.log('Unchanged:', data === identity);

// XOR twice (returns original)
const encrypted = Hex.xor(data, hex1);
const decrypted = Hex.xor(encrypted, hex1);
console.log('\\nOriginal:', data);
console.log('XOR with key:', encrypted);
console.log('XOR again:', decrypted);
console.log('Match:', data === decrypted);
`,

	"hex-validate.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Validate hex strings
const valid1 = '0x1234';
const valid2 = '0xdeadbeef';
const valid3 = 'abcdef';

console.log('Valid hex 1:', valid1);
console.log('Is valid:', Hex.isHex(valid1));

console.log('\\nValid hex 2:', valid2);
console.log('Is valid:', Hex.isHex(valid2));

console.log('\\nValid hex 3 (no prefix):', valid3);
console.log('Is valid:', Hex.isHex(valid3));

// Invalid hex
const invalid1 = '0xghij';
const invalid2 = '0x123';

console.log('\\nInvalid hex 1:', invalid1);
console.log('Is valid:', Hex.isHex(invalid1));

console.log('\\nInvalid hex 2 (odd length):', invalid2);
console.log('Is valid:', Hex.isHex(invalid2));

// Size validation
const hex32 = '0x' + '00'.repeat(32);
console.log('\\n32-byte hex:', hex32);
console.log('Is 32 bytes:', Hex.isSized(hex32, 32));
console.log('Is 16 bytes:', Hex.isSized(hex32, 16));
`,

	"hex-random.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Generate random hex values
const random4 = Hex.random(4);
console.log('Random 4 bytes:', random4);
console.log('Size:', Hex.size(random4), 'bytes');

const random32 = Hex.random(32);
console.log('\\nRandom 32 bytes:', random32);
console.log('Size:', Hex.size(random32), 'bytes');

// Generate multiple random values
console.log('\\nMultiple random 8-byte values:');
for (let i = 0; i < 3; i++) {
  const rand = Hex.random(8);
  console.log(\\\`  \\\${i + 1}:\\\`, rand);
}

// Random nonce
const nonce = Hex.random(8);
console.log('\\nRandom nonce:', nonce);
console.log('As number:', Hex.toNumber(nonce));
`,

	"hex-zero.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Create zero-filled hex values
const zero4 = Hex.zero(4);
console.log('4 zero bytes:', zero4);
console.log('Size:', Hex.size(zero4), 'bytes');

const zero32 = Hex.zero(32);
console.log('\\n32 zero bytes:', zero32);
console.log('Size:', Hex.size(zero32), 'bytes');

// Verify they are all zeros
console.log('\\nAs number:', Hex.toNumber(zero32));
console.log('As BigInt:', Hex.toBigInt(zero32));

// Zero address
const zeroAddress = Hex.zero(20);
console.log('\\nZero address (20 bytes):', zeroAddress);

// Zero hash
const zeroHash = Hex.zero(32);
console.log('\\nZero hash (32 bytes):', zeroHash);
`,

	"hex-from-boolean.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert boolean to hex
const hexTrue = Hex.fromBoolean(true);
const hexFalse = Hex.fromBoolean(false);

console.log('Boolean true to hex:', hexTrue);
console.log('Boolean false to hex:', hexFalse);

// Round-trip conversion
const backToTrue = Hex.toBoolean(hexTrue);
const backToFalse = Hex.toBoolean(hexFalse);

console.log('\\nRound-trip true:', backToTrue);
console.log('Round-trip false:', backToFalse);

// In calldata encoding
const encodedTrue = Hex.pad(hexTrue, 32);
const encodedFalse = Hex.pad(hexFalse, 32);

console.log('\\nPadded true (32 bytes):', encodedTrue);
console.log('Padded false (32 bytes):', encodedFalse);
`,

	"hex-to-boolean.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Convert hex to boolean
const hexFalse = '0x00';
const hexTrue = '0x01';

console.log('Hex 0x00 to boolean:', Hex.toBoolean(hexFalse));
console.log('Hex 0x01 to boolean:', Hex.toBoolean(hexTrue));

// Non-zero values are truthy
const nonZero = '0xff';
console.log('\\nHex 0xff to boolean:', Hex.toBoolean(nonZero));

// Padded values
const paddedFalse = '0x0000000000000000000000000000000000000000000000000000000000000000';
const paddedTrue = '0x0000000000000000000000000000000000000000000000000000000000000001';

console.log('\\nPadded false:', Hex.toBoolean(paddedFalse));
console.log('Padded true:', Hex.toBoolean(paddedTrue));

// Round-trip
const original = true;
const hexed = Hex.fromBoolean(original);
const restored = Hex.toBoolean(hexed);

console.log('\\nOriginal boolean:', original);
console.log('As hex:', hexed);
console.log('Restored:', restored);
console.log('Match:', original === restored);
`,

	"hex-size.ts": `import * as Hex from 'voltaire/primitives/Hex';

// Get size in bytes of hex strings
const hex1 = '0x1234';
console.log('Hex:', hex1);
console.log('Size:', Hex.size(hex1), 'bytes');
console.log('Characters (with 0x):', hex1.length);

const hex2 = '0xdeadbeef';
console.log('\\nHex:', hex2);
console.log('Size:', Hex.size(hex2), 'bytes');

// Address (20 bytes)
const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
console.log('\\nAddress:', address);
console.log('Size:', Hex.size(address), 'bytes');

// Hash (32 bytes)
const hash = '0x' + '42'.repeat(32);
console.log('\\nHash:', hash);
console.log('Size:', Hex.size(hash), 'bytes');

// Size relationship
const testHex = '0xaabbccdd';
const sizeInBytes = Hex.size(testHex);
const hexChars = testHex.length - 2;
console.log('\\nHex:', testHex);
console.log('Hex chars (without 0x):', hexChars);
console.log('Size in bytes:', sizeInBytes);
console.log('Relationship: bytes = chars / 2:', sizeInBytes === hexChars / 2);
`,

	"hash-from-hex.ts": `// Hash: Create hash from hex string
import { Hash } from 'voltaire/primitives/Hash';

// Create hash from hex string (with 0x prefix)
const hash1 = Hash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
console.log('Hash from hex:', hash1.toHex());

// Create from hex without prefix
const hash2 = Hash.fromHex('0x' + 'ff'.repeat(32));
console.log('Hash (all 0xff):', hash2.toHex());

// Hash size is always 32 bytes
console.log('Hash size:', Hash.SIZE, 'bytes');
console.log('Actual length:', hash1.length, 'bytes');
`,

	"hash-from-bytes.ts": `// Hash: Create hash from Uint8Array
import { Hash } from 'voltaire/primitives/Hash';

// Create from Uint8Array
const bytes = new Uint8Array(32);
bytes[0] = 0xde;
bytes[1] = 0xad;
bytes[2] = 0xbe;
bytes[3] = 0xef;

const hash = Hash.fromBytes(bytes);
console.log('Hash from bytes:', hash.toHex());

// Convert back to bytes
const extracted = hash.toBytes();
console.log('Bytes equal:', extracted[0] === 0xde && extracted[1] === 0xad);
`,

	"hash-equals.ts": `// Hash: Compare hashes for equality
import { Hash } from 'voltaire/primitives/Hash';

// Create two identical hashes
const hash1 = Hash('0x' + '42'.repeat(32));
const hash2 = Hash('0x' + '42'.repeat(32));

console.log('Hash 1:', hash1.toHex());
console.log('Hash 2:', hash2.toHex());
console.log('Are equal:', hash1.equals(hash2));

// Different hashes
const hash3 = Hash('0x' + 'ff'.repeat(32));
console.log('Different:', hash1.equals(hash3));

// Zero hash check
const zero = Hash.ZERO;
console.log('Is zero:', zero.isZero());
`,

	"hash-keccak256.ts": `// Hash: Compute Keccak256 hashes
import { Hash } from 'voltaire/primitives/Hash';
import { Hex } from 'voltaire/primitives/Hex';

// Hash from string
const hash1 = Hash.keccak256String('Hello, Voltaire!');
console.log('Keccak256("Hello, Voltaire!"):', hash1.toHex());

// Hash from hex
const hash2 = Hash.keccak256Hex('0x1234');
console.log('Keccak256(0x1234):', hash2.toHex());

// Hash from bytes
const data = new Uint8Array([0x01, 0x02, 0x03]);
const hash3 = Hash.keccak256(data);
console.log('Keccak256([1,2,3]):', hash3.toHex());
`,

	"hash-slice.ts": `// Hash: Extract portions of hash
import { Hash } from 'voltaire/primitives/Hash';

// Create a hash
const hash = Hash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
console.log('Full hash:', hash.toHex());

// Slice first 4 bytes
const first4 = hash.slice(0, 4);
console.log('First 4 bytes:', Hash.toHex(first4));

// Slice last 4 bytes
const last4 = hash.slice(-4);
console.log('Last 4 bytes:', Hash.toHex(last4));

// Middle bytes
const middle = hash.slice(14, 18);
console.log('Middle bytes:', Hash.toHex(middle));
`,

	"hash-format.ts": `// Hash: Format hash for display
import { Hash } from 'voltaire/primitives/Hash';

// Create a hash
const hash = Hash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

// Full hex
console.log('Full:', hash.toHex());

// Formatted (default: 6 prefix + 4 suffix)
console.log('Formatted:', hash.format());

// Custom format
console.log('Custom:', Hash.format(hash, 8, 6));

// String representation
console.log('String:', hash.toString());
`,

	"hash-concat.ts": `// Hash: Concatenate and hash multiple hashes
import { Hash } from 'voltaire/primitives/Hash';

// Create two hashes
const hash1 = Hash.keccak256String('first');
const hash2 = Hash.keccak256String('second');

console.log('Hash 1:', hash1.toHex());
console.log('Hash 2:', hash2.toHex());

// Concatenate and hash them together
const combined = Hash.concat(hash1, hash2);
console.log('Combined:', combined.toHex());

// Works with multiple hashes
const hash3 = Hash.keccak256String('third');
const multi = Hash.concat(hash1, hash2, hash3);
console.log('Multiple:', multi.toHex());
`,

	"hash-merkle-root.ts": `// Hash: Compute Merkle root
import { Hash } from 'voltaire/primitives/Hash';

// Create leaf hashes
const leaves = [
  Hash.keccak256String('leaf1'),
  Hash.keccak256String('leaf2'),
  Hash.keccak256String('leaf3'),
  Hash.keccak256String('leaf4'),
];

console.log('Leaves:');
leaves.forEach((leaf, i) => {
  console.log(\`  [\${i}]: \${leaf.format()}\`);
});

// Compute Merkle root
const root = Hash.merkleRoot(leaves);
console.log('Merkle root:', root.toHex());
`,

	"hash-random.ts": `// Hash: Generate random hash
import { Hash } from 'voltaire/primitives/Hash';

// Generate random hashes
const random1 = Hash.random();
const random2 = Hash.random();

console.log('Random 1:', random1.toHex());
console.log('Random 2:', random2.toHex());
console.log('Are different:', !random1.equals(random2));

// Check they're valid hashes
console.log('Is valid hash:', Hash.isHash(random1));
console.log('Length:', random1.length, 'bytes');
`,

	"hash-clone.ts": `// Hash: Clone hash instances
import { Hash } from 'voltaire/primitives/Hash';

// Create a hash
const original = Hash.keccak256String('original data');
console.log('Original:', original.toHex());

// Clone it
const cloned = original.clone();
console.log('Cloned:', cloned.toHex());

// They're equal but different instances
console.log('Values equal:', original.equals(cloned));
console.log('Different instances:', original !== cloned);

// Modifying clone doesn't affect original
cloned[0] = 0xff;
console.log('Original unchanged:', original[0] !== 0xff);
`,

	"rlp-encoding.ts": `// RLP: Recursive Length Prefix encoding
import { RLP } from 'voltaire/primitives/RLP';
import { Hex } from 'voltaire/primitives/Hex';

// Encode simple string
const encoded = RLP.encode(Hex.fromString('dog'));
console.log('Encoded "dog":', encoded.toString());

// Encode array
const list = RLP.encode([Hex.fromString('cat'), Hex.fromString('dog')]);
console.log('Encoded array:', list.toString());

// Encode number
const number = RLP.encode(Hex.fromNumber(1024));
console.log('Encoded number:', number.toString());
`,

	"bytes-operations.ts": `// Working with Uint8Arrays
import { Address } from 'voltaire/primitives/Address';
import { Hex } from 'voltaire/primitives/Hex';

// Create address and get bytes
const addr = Address('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
const bytes = addr.toBytes();
console.log('Address bytes:', bytes);
console.log('Bytes length:', bytes.length);

// Convert bytes to hex
const hex = Hex.from(bytes);
console.log('As hex:', hex.toString());

// Check zero
console.log('Is zero:', addr.isZero());
`,

	// ABI Examples
	"abi-encode-function.ts": `// ABI: Encode function calls
import * as ABI from 'voltaire/primitives/ABI';

// Encode ERC20 transfer
const transfer = ABI.Function.encodeParams(
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' }
    ]
  },
  ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 100n]
);
console.log('Transfer calldata:', transfer);

// Encode approve
const approve = ABI.Function.encodeParams(
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'value' }
    ]
  },
  ['0x1234567890123456789012345678901234567890', 1000000000000000000n]
);
console.log('Approve calldata:', approve);
`,

	"abi-decode-function.ts": `// ABI: Decode function results
import * as ABI from 'voltaire/primitives/ABI';
import * as Hex from 'voltaire/primitives/Hex';

// Decode transfer result
const transferData = Hex.fromString('0x0000000000000000000000000000000000000000000000000000000000000001');
const transferResult = ABI.Function.decodeResult(
  {
    name: 'transfer',
    type: 'function',
    outputs: [{ type: 'bool', name: 'success' }]
  },
  transferData
);
console.log('Transfer result:', transferResult);

// Decode balanceOf
const balanceData = Hex.fromString('0x00000000000000000000000000000000000000000000003635c9adc5dea00000');
const balance = ABI.Function.decodeResult(
  {
    name: 'balanceOf',
    type: 'function',
    outputs: [{ type: 'uint256', name: 'balance' }]
  },
  balanceData
);
console.log('Balance:', balance);
`,

	"abi-encode-event.ts": `// ABI: Encode event topics
import * as ABI from 'voltaire/primitives/ABI';

// Encode Transfer event topics
const transferTopics = ABI.Event.encodeTopics({
  name: 'Transfer',
  type: 'event',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
}, {
  from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  to: '0x1234567890123456789012345678901234567890'
});
console.log('Transfer topics:', transferTopics);

// Encode Approval event topics
const approvalTopics = ABI.Event.encodeTopics({
  name: 'Approval',
  type: 'event',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'spender', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
}, {
  owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  spender: '0x1234567890123456789012345678901234567890'
});
console.log('Approval topics:', approvalTopics);
`,

	"abi-decode-event.ts": `// ABI: Decode event logs
import * as ABI from 'voltaire/primitives/ABI';
import * as Hex from 'voltaire/primitives/Hex';

// Decode Transfer event
const transferLog = ABI.Event.decodeLog({
  name: 'Transfer',
  type: 'event',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
}, {
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e',
    '0x0000000000000000000000001234567890123456789012345678901234567890'
  ],
  data: Hex.fromString('0x0000000000000000000000000000000000000000000000000000000000000064')
});
console.log('Transfer event:', transferLog);
`,

	"abi-function-selector.ts": `// ABI: Calculate function selectors
import * as ABI from 'voltaire/primitives/ABI';

// From signature string
const transferSelector = ABI.Function.getSelector('transfer(address,uint256)');
console.log('transfer selector:', transferSelector);

// From function definition
const approveSelector = ABI.Function.getSelector({
  name: 'approve',
  type: 'function',
  inputs: [
    { type: 'address', name: 'spender' },
    { type: 'uint256', name: 'value' }
  ]
});
console.log('approve selector:', approveSelector);

// Common ERC20 selectors
const balanceOfSelector = ABI.Function.getSelector('balanceOf(address)');
const transferFromSelector = ABI.Function.getSelector('transferFrom(address,address,uint256)');

console.log('balanceOf:', balanceOfSelector);
console.log('transferFrom:', transferFromSelector);
`,

	"abi-event-signature.ts": `// ABI: Calculate event signatures
import * as ABI from 'voltaire/primitives/ABI';

// From signature string
const transferSig = ABI.Event.getSelector('Transfer(address,address,uint256)');
console.log('Transfer signature:', transferSig);

// From event definition
const approvalSig = ABI.Event.getSelector({
  name: 'Approval',
  type: 'event',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'spender', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
});
console.log('Approval signature:', approvalSig);
`,

	"abi-encode-parameters.ts": `// ABI: Encode parameters
import * as ABI from 'voltaire/primitives/ABI';

// Basic types
const basic = ABI.encodeParameters(
  [
    { type: 'uint256', name: 'amount' },
    { type: 'address', name: 'recipient' },
    { type: 'bool', name: 'success' }
  ],
  [1000n, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', true]
);
console.log('Basic params:', basic);

// Arrays
const arrays = ABI.encodeParameters(
  [
    { type: 'uint256[]', name: 'amounts' },
    { type: 'address[]', name: 'recipients' }
  ],
  [
    [100n, 200n, 300n],
    ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '0x1234567890123456789012345678901234567890']
  ]
);
console.log('Array params:', arrays);
`,

	"abi-decode-parameters.ts": `// ABI: Decode parameters
import * as ABI from 'voltaire/primitives/ABI';
import * as Hex from 'voltaire/primitives/Hex';

// Decode basic types
const basicData = Hex.fromString(
  '0x' +
  '00000000000000000000000000000000000000000000000000000000000003e8' +
  '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
  '0000000000000000000000000000000000000000000000000000000000000001'
);

const params = ABI.decodeParameters(
  [
    { type: 'uint256', name: 'amount' },
    { type: 'address', name: 'recipient' },
    { type: 'bool', name: 'success' }
  ],
  basicData
);
console.log('Decoded params:', params);
`,

	"abi-encode-packed.ts": `// ABI: Packed encoding
import * as ABI from 'voltaire/primitives/ABI';

// For signature verification
const packed = ABI.encodePacked(
  [
    { type: 'string' },
    { type: 'address' },
    { type: 'uint256' }
  ],
  [
    'Hello',
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    12345n
  ]
);
console.log('Packed encoding:', packed);

// Token ID generation
const tokenId = ABI.encodePacked(
  [
    { type: 'address' },
    { type: 'uint256' }
  ],
  [
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    1n
  ]
);
console.log('Token ID:', tokenId);
`,

	"abi-encode-constructor.ts": `// ABI: Encode constructor parameters
import * as ABI from 'voltaire/primitives/ABI';

// Basic constructor
const basic = ABI.Constructor.encodeParams({
  type: 'constructor',
  inputs: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'symbol' },
    { type: 'uint8', name: 'decimals' }
  ]
}, ['MyToken', 'MTK', 18]);
console.log('Constructor params:', basic);

// With address and supply
const token = ABI.Constructor.encodeParams({
  type: 'constructor',
  inputs: [
    { type: 'address', name: 'owner' },
    { type: 'uint256', name: 'initialSupply' }
  ]
}, ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 1000000000000000000000000n]);
console.log('Token constructor:', token);
`,

	"abi-encode-tuple.ts": `// ABI: Encode tuples
import * as ABI from 'voltaire/primitives/ABI';

// Simple tuple
const simple = ABI.encodeParameters(
  [
    {
      type: 'tuple',
      name: 'user',
      components: [
        { type: 'address', name: 'addr' },
        { type: 'uint256', name: 'balance' }
      ]
    }
  ],
  [[
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    1000n
  ]]
);
console.log('Simple tuple:', simple);

// Array of tuples
const orders = ABI.encodeParameters(
  [
    {
      type: 'tuple[]',
      name: 'orders',
      components: [
        { type: 'address', name: 'maker' },
        { type: 'uint256', name: 'amount' },
        { type: 'uint256', name: 'price' }
      ]
    }
  ],
  [[
    ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 100n, 50n],
    ['0x1234567890123456789012345678901234567890', 200n, 100n]
  ]]
);
console.log('Tuple array:', orders);
`,

	"abi-encode-array.ts": `// ABI: Encode arrays
import * as ABI from 'voltaire/primitives/ABI';

// Dynamic uint array
const dynamic = ABI.encodeParameters(
  [{ type: 'uint256[]', name: 'values' }],
  [[1n, 2n, 3n, 4n, 5n]]
);
console.log('Dynamic array:', dynamic);

// Fixed-size array
const fixed = ABI.encodeParameters(
  [{ type: 'uint256[5]', name: 'values' }],
  [[1n, 2n, 3n, 4n, 5n]]
);
console.log('Fixed array:', fixed);

// Address array
const addresses = ABI.encodeParameters(
  [{ type: 'address[]', name: 'addresses' }],
  [[
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    '0x1234567890123456789012345678901234567890'
  ]]
);
console.log('Address array:', addresses);
`,

	"abi-encode-error.ts": `// ABI: Encode custom errors
import * as ABI from 'voltaire/primitives/ABI';

// Error without params
const unauthorized = ABI.Error.encodeParams({
  name: 'Unauthorized',
  type: 'error',
  inputs: []
});
console.log('Unauthorized:', unauthorized);

// Error with params
const insufficientBalance = ABI.Error.encodeParams({
  name: 'InsufficientBalance',
  type: 'error',
  inputs: [
    { type: 'address', name: 'account' },
    { type: 'uint256', name: 'balance' },
    { type: 'uint256', name: 'needed' }
  ]
}, [
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  100n,
  1000n
]);
console.log('InsufficientBalance:', insufficientBalance);
`,

	"abi-parse-logs.ts": `// ABI: Parse multiple logs
import * as ABI from 'voltaire/primitives/ABI';
import * as Hex from 'voltaire/primitives/Hex';

// Create ABI
const abi = ABI.Abi([
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { type: 'address', name: 'from', indexed: true },
      { type: 'address', name: 'to', indexed: true },
      { type: 'uint256', name: 'value', indexed: false }
    ]
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { type: 'address', name: 'owner', indexed: true },
      { type: 'address', name: 'spender', indexed: true },
      { type: 'uint256', name: 'value', indexed: false }
    ]
  }
]);

// Parse logs
const logs = [
  {
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e',
      '0x0000000000000000000000001234567890123456789012345678901234567890'
    ],
    data: Hex.fromString('0x0000000000000000000000000000000000000000000000000000000000000064')
  }
];

const parsed = ABI.parseLogs(abi, logs);
console.log('Parsed logs:', parsed);
`,
};
