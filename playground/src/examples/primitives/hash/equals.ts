import { Hash } from "@tevm/voltaire";
// Example: Comparing hashes for equality

// Same hash values
const hash1 = Hash.fromHex(
	"0xa4b1f606b66105fa45e33b1c5f5b5f4a9c6e5d3c2b1a0987654321fedcba9876",
);
const hash2 = Hash.fromHex(
	"0xa4b1f606b66105fa45e33b1c5f5b5f4a9c6e5d3c2b1a0987654321fedcba9876",
);

// Different hash values
const hash3 = Hash.fromHex(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// Case insensitive comparison
const lowerCase = Hash.fromHex(
	"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
);
const upperCase = Hash.fromHex(
	"0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF",
);
