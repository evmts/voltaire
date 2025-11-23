import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

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
		const padded = new Uint8Array(blockSize);
		padded.set(k);
		k = padded;
	}

	// Generate inner and outer padding
	const ipad = new Uint8Array(blockSize);
	const opad = new Uint8Array(blockSize);
	for (let i = 0; i < blockSize; i++) {
		ipad[i] = k[i] ^ 0x36;
		opad[i] = k[i] ^ 0x5c;
	}

	// HMAC = H(opad || H(ipad || message))
	const innerMsg = new Uint8Array(blockSize + message.length);
	innerMsg.set(ipad);
	innerMsg.set(message, blockSize);
	const innerHash = SHA256.hash(innerMsg);

	const outerMsg = new Uint8Array(blockSize + 32);
	outerMsg.set(opad);
	outerMsg.set(innerHash, blockSize);
	return SHA256.hash(outerMsg);
}

// Example: Authenticate a message
const key = new TextEncoder().encode("secret-key");
const message = new TextEncoder().encode("Important message");

const mac = hmacSha256(key, message);
console.log("Message:", new TextDecoder().decode(message));
console.log("Key:", new TextDecoder().decode(key));
console.log("HMAC-SHA256:", Hex.fromBytes(mac));

// Verify message integrity
const verifyMac = hmacSha256(key, message);
const verified = mac.every((b, i) => b === verifyMac[i]);
console.log("\nMAC verified:", verified);

// Different key produces different MAC
const wrongKey = new TextEncoder().encode("wrong-key");
const wrongMac = hmacSha256(wrongKey, message);
const different = !mac.every((b, i) => b === wrongMac[i]);
console.log("Different key rejected:", different);

// Different message produces different MAC
const wrongMsg = new TextEncoder().encode("Tampered message");
const tamperedMac = hmacSha256(key, wrongMsg);
const tampered = !mac.every((b, i) => b === tamperedMac[i]);
console.log("Tampered message detected:", tampered);
