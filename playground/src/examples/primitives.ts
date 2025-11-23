export const primitiveExamples = {
	"address-basics.ts": `// Address: Creating and validating Ethereum addresses
import { Address, toHex, equals } from 'voltaire/primitives/Address';

// Create from hex string
const addr = Address('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
console.log('Address:', toHex(addr));

// Check equality
const addr2 = Address('0x742d35cc6634c0532925a3b844bc454e4438f44e');
console.log('Addresses equal:', equals(addr, addr2));

// Check if zero
console.log('Is zero:', addr.isZero());

// Get bytes
console.log('Bytes length:', addr.toBytes().length);
`,

	"hex-encoding.ts": `// Hex: Encoding and decoding hex strings
import { Hex } from 'voltaire/primitives/Hex';

// Create from string
const hex = Hex('0x48656c6c6f');
console.log('Hex:', hex.toString());
console.log('Size:', hex.size(), 'bytes');

// Encode from UTF-8 string
const encoded = Hex.fromString('Hello!');
console.log('Encoded:', encoded.toString());

// Decode to UTF-8
const decoded = new TextDecoder().decode(encoded);
console.log('Decoded:', decoded);
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
};
