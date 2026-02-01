import { Bytes, Hex, SHA256 } from "@tevm/voltaire";
// HMAC-SHA256: Hash-based Message Authentication Code
// Provides message integrity and authentication using a secret key

// Simple HMAC-SHA256 implementation
function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
	const blockSize = 64; // SHA256 block size

	// Derive key
	let k = key;
	if (k.length > blockSize) {
		k = SHA256.hash(k);
	}
	if (k.length < blockSize) {
		k = Bytes.concat(k, Bytes.zero(blockSize - k.length));
	}

	// Generate inner and outer padding
	const ipad = Bytes(Array.from({ length: blockSize }, (_, i) => k[i] ^ 0x36));
	const opad = Bytes(Array.from({ length: blockSize }, (_, i) => k[i] ^ 0x5c));

	// HMAC = H(opad || H(ipad || message))
	const innerMsg = Bytes.concat(ipad, message);
	const innerHash = SHA256.hash(innerMsg);

	const outerMsg = Bytes.concat(opad, innerHash);
	return SHA256.hash(outerMsg);
}

// Example: Authenticate a message
const key = new TextEncoder().encode("secret-key");
const message = new TextEncoder().encode("Important message");

const mac = hmacSha256(key, message);

// Verify message integrity
const verifyMac = hmacSha256(key, message);
const verified = mac.every((b, i) => b === verifyMac[i]);

// Different key produces different MAC
const wrongKey = new TextEncoder().encode("wrong-key");
const wrongMac = hmacSha256(wrongKey, message);
const different = !mac.every((b, i) => b === wrongMac[i]);

// Different message produces different MAC
const wrongMsg = new TextEncoder().encode("Tampered message");
const tamperedMac = hmacSha256(key, wrongMsg);
const tampered = !mac.every((b, i) => b === tamperedMac[i]);
