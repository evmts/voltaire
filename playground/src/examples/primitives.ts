export const primitiveExamples = {
  'address-basics.ts': `// Address: Creating and validating Ethereum addresses
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

  'hex-encoding.ts': `// Hex: Encoding and decoding hex strings
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

  'hash-operations.ts': `// Hash: Working with 32-byte hashes
import { Hash } from 'voltaire/primitives/Hash';

// Create hash from hex
const hash = Hash('0x' + '42'.repeat(32));
console.log('Hash:', hash.toHex());
console.log('Size:', Hash.SIZE, 'bytes');

// Hash equality
const hash2 = Hash('0x' + '42'.repeat(32));
console.log('Hashes equal:', hash.equals(hash2));

// Zero hash
const zero = Hash.zero();
console.log('Zero hash:', zero.toHex());
`,

  'rlp-encoding.ts': `// RLP: Recursive Length Prefix encoding
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

  'bytes-operations.ts': `// Working with Uint8Arrays
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
