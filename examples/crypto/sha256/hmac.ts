/**
 * HMAC-SHA256 Example
 *
 * Demonstrates Hash-based Message Authentication Code using SHA-256:
 * - HMAC construction from scratch
 * - Key derivation
 * - Message authentication
 * - Comparison with insecure approaches
 */

import { SHA256 } from "../../../src/crypto/sha256/SHA256.js";

console.log("=== HMAC-SHA256 ===\n");

// HMAC-SHA256 Implementation
function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
	const blockSize = SHA256.BLOCK_SIZE; // 64 bytes

	// Step 1: Key derivation
	// If key is longer than block size, hash it first
	let derivedKey: Uint8Array;
	if (key.length > blockSize) {
		derivedKey = SHA256.hash(key);
	} else {
		derivedKey = key;
	}

	// Pad key to block size
	const paddedKey = new Uint8Array(blockSize);
	paddedKey.set(derivedKey);

	// Step 2: Create inner and outer padding
	const opad = new Uint8Array(blockSize).fill(0x5c);
	const ipad = new Uint8Array(blockSize).fill(0x36);

	for (let i = 0; i < blockSize; i++) {
		opad[i] ^= paddedKey[i];
		ipad[i] ^= paddedKey[i];
	}

	// Step 3: Compute HMAC = H(opad || H(ipad || message))
	const innerData = new Uint8Array(ipad.length + message.length);
	innerData.set(ipad, 0);
	innerData.set(message, ipad.length);
	const innerHash = SHA256.hash(innerData);

	const outerData = new Uint8Array(opad.length + innerHash.length);
	outerData.set(opad, 0);
	outerData.set(innerHash, opad.length);

	return SHA256.hash(outerData);
}

// Example 1: Basic HMAC
console.log("1. Basic HMAC-SHA256");
console.log("-".repeat(70));

const key1 = new TextEncoder().encode("secret-key");
const message1 = new TextEncoder().encode("Hello, World!");

const mac1 = hmacSha256(key1, message1);
console.log("Key:", new TextDecoder().decode(key1));
console.log("Message:", new TextDecoder().decode(message1));
console.log("HMAC:", SHA256.toHex(mac1));
console.log();

// Example 2: HMAC with different keys produces different MACs
console.log("2. Key Sensitivity");
console.log("-".repeat(70));

const key2a = new TextEncoder().encode("key-a");
const key2b = new TextEncoder().encode("key-b");
const message2 = new TextEncoder().encode("same message");

const mac2a = hmacSha256(key2a, message2);
const mac2b = hmacSha256(key2b, message2);

console.log("Message:", new TextDecoder().decode(message2));
console.log("Key A:  ", new TextDecoder().decode(key2a));
console.log("HMAC A: ", SHA256.toHex(mac2a));
console.log("Key B:  ", new TextDecoder().decode(key2b));
console.log("HMAC B: ", SHA256.toHex(mac2b));
console.log("MACs are different:", SHA256.toHex(mac2a) !== SHA256.toHex(mac2b));
console.log();

// Example 3: HMAC verification
console.log("3. HMAC Verification (Constant-Time Comparison)");
console.log("-".repeat(70));

function verifyHmac(
	message: Uint8Array,
	key: Uint8Array,
	providedMac: Uint8Array,
): boolean {
	const computedMac = hmacSha256(key, message);

	// Constant-time comparison to prevent timing attacks
	if (providedMac.length !== computedMac.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < providedMac.length; i++) {
		result |= providedMac[i] ^ computedMac[i];
	}

	return result === 0;
}

const authKey = new TextEncoder().encode("authentication-key");
const authMessage = new TextEncoder().encode("authenticated message");
const validMac = hmacSha256(authKey, authMessage);

console.log(
	"Valid MAC verification:",
	verifyHmac(authMessage, authKey, validMac),
);

// Tampered message
const tamperedMessage = new TextEncoder().encode("tampered message");
console.log(
	"Tampered message verification:",
	verifyHmac(tamperedMessage, authKey, validMac),
);

// Tampered MAC
const tamperedMac = new Uint8Array(validMac);
tamperedMac[0] ^= 0x01; // Flip one bit
console.log(
	"Tampered MAC verification:",
	verifyHmac(authMessage, authKey, tamperedMac),
);
console.log();

// Example 4: INSECURE vs SECURE message authentication
console.log("4. INSECURE vs SECURE Approaches");
console.log("-".repeat(70));

const secret = new TextEncoder().encode("secret");
const msg = new TextEncoder().encode("message");

// INSECURE: Simple concatenation (vulnerable to length extension)
console.log("❌ INSECURE: H(secret || message)");
const insecure = new Uint8Array(secret.length + msg.length);
insecure.set(secret, 0);
insecure.set(msg, secret.length);
const insecureHash = SHA256.hash(insecure);
console.log("   Hash:", SHA256.toHex(insecureHash));
console.log("   Vulnerable to length extension attack!\n");

// SECURE: HMAC
console.log("✓ SECURE: HMAC-SHA256(secret, message)");
const secureMac = hmacSha256(secret, msg);
console.log("  HMAC:", SHA256.toHex(secureMac));
console.log("  Resistant to length extension attack!\n");

console.log();

// Example 5: HMAC with long keys
console.log("5. Key Length Handling");
console.log("-".repeat(70));

// Short key (< 64 bytes) - used as-is and padded
const shortKey = new TextEncoder().encode("short");
const shortMac = hmacSha256(shortKey, message1);
console.log("Short key (5 bytes):", new TextDecoder().decode(shortKey));
console.log("HMAC:", SHA256.toHex(shortMac));
console.log("Key padded to 64 bytes internally\n");

// Long key (> 64 bytes) - hashed first
const longKey = new TextEncoder().encode("a".repeat(100));
const longMac = hmacSha256(longKey, message1);
console.log(
	"Long key (100 bytes):",
	new TextDecoder().decode(longKey).slice(0, 20) + "...",
);
console.log("HMAC:", SHA256.toHex(longMac));
console.log("Key hashed to 32 bytes, then padded to 64 bytes\n");

console.log();

// Example 6: HMAC for API authentication
console.log("6. API Request Authentication");
console.log("-".repeat(70));

interface ApiRequest {
	method: string;
	path: string;
	timestamp: number;
	body: string;
}

function signApiRequest(request: ApiRequest, apiSecret: string): string {
	const canonical = `${request.method}\n${request.path}\n${request.timestamp}\n${request.body}`;
	const canonicalBytes = new TextEncoder().encode(canonical);
	const secretBytes = new TextEncoder().encode(apiSecret);
	const signature = hmacSha256(secretBytes, canonicalBytes);
	return SHA256.toHex(signature);
}

const apiRequest: ApiRequest = {
	method: "POST",
	path: "/api/v1/users",
	timestamp: Date.now(),
	body: '{"name":"Alice"}',
};

const apiSecret = "super-secret-api-key-12345";
const signature = signApiRequest(apiRequest, apiSecret);

console.log("API Request:");
console.log("  Method:", apiRequest.method);
console.log("  Path:", apiRequest.path);
console.log("  Timestamp:", apiRequest.timestamp);
console.log("  Body:", apiRequest.body);
console.log("\nSignature:", signature);
console.log("\nServer can verify request by recomputing HMAC");
console.log();

// Example 7: HMAC Test Vector (RFC 4231)
console.log("7. RFC 4231 Test Vector");
console.log("-".repeat(70));

const rfcKey = new Uint8Array(20).fill(0x0b);
const rfcData = new TextEncoder().encode("Hi There");
const rfcMac = hmacSha256(rfcKey, rfcData);

console.log(
	"Key (20 bytes):",
	Array.from(rfcKey.slice(0, 10))
		.map((b) => "0x" + b.toString(16).padStart(2, "0"))
		.join(" "),
	"...",
);
console.log("Data:", new TextDecoder().decode(rfcData));
console.log("HMAC:", SHA256.toHex(rfcMac));
console.log(
	"Expected: 0xb0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
);
console.log();

console.log("=== HMAC-SHA256 Complete ===");
