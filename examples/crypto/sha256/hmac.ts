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

const key1 = new TextEncoder().encode("secret-key");
const message1 = new TextEncoder().encode("Hello, World!");

const mac1 = hmacSha256(key1, message1);

const key2a = new TextEncoder().encode("key-a");
const key2b = new TextEncoder().encode("key-b");
const message2 = new TextEncoder().encode("same message");

const mac2a = hmacSha256(key2a, message2);
const mac2b = hmacSha256(key2b, message2);

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

// Tampered message
const tamperedMessage = new TextEncoder().encode("tampered message");

// Tampered MAC
const tamperedMac = new Uint8Array(validMac);
tamperedMac[0] ^= 0x01; // Flip one bit

const secret = new TextEncoder().encode("secret");
const msg = new TextEncoder().encode("message");
const insecure = new Uint8Array(secret.length + msg.length);
insecure.set(secret, 0);
insecure.set(msg, secret.length);
const insecureHash = SHA256.hash(insecure);
const secureMac = hmacSha256(secret, msg);

// Short key (< 64 bytes) - used as-is and padded
const shortKey = new TextEncoder().encode("short");
const shortMac = hmacSha256(shortKey, message1);

// Long key (> 64 bytes) - hashed first
const longKey = new TextEncoder().encode("a".repeat(100));
const longMac = hmacSha256(longKey, message1);

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

const rfcKey = new Uint8Array(20).fill(0x0b);
const rfcData = new TextEncoder().encode("Hi There");
const rfcMac = hmacSha256(rfcKey, rfcData);
