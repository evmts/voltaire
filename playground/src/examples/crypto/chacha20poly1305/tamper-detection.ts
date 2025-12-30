/**
 * ChaCha20-Poly1305 Tamper Detection
 *
 * Demonstrates how the Poly1305 authentication tag detects:
 * - Bit flips in ciphertext
 * - Truncation
 * - Extension attacks
 * - Reordering attacks
 */
import { ChaCha20Poly1305, DecryptionError } from "@tevm/voltaire";

console.log("=== ChaCha20-Poly1305 Tamper Detection ===\n");

const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const plaintext = new TextEncoder().encode("Original secret message");
const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

console.log(`Original plaintext: "${new TextDecoder().decode(plaintext)}"`);
console.log(`Ciphertext: ${Buffer.from(ciphertext).toString("hex")}`);
console.log(`Ciphertext length: ${ciphertext.length} bytes\n`);

// Helper to test tampering
function testTamperDetection(name: string, tampered: Uint8Array): void {
	console.log(`--- ${name} ---`);
	console.log(`Tampered: ${Buffer.from(tampered).toString("hex")}`);
	try {
		ChaCha20Poly1305.decrypt(tampered, key, nonce);
		console.log("SECURITY FAILURE: Tampered data was accepted!\n");
	} catch (error) {
		if (error instanceof DecryptionError) {
			console.log("Tamper detected: Decryption correctly rejected\n");
		} else {
			console.log(`Unexpected error: ${error}\n`);
		}
	}
}

// Test 1: Single bit flip in ciphertext
console.log("=== Test 1: Single Bit Flip ===");
const bitFlip = new Uint8Array(ciphertext);
bitFlip[0] ^= 0x01; // Flip least significant bit of first byte
testTamperDetection("Flip bit 0 of byte 0", bitFlip);

// Test 2: Flip bit in middle of ciphertext
const middleFlip = new Uint8Array(ciphertext);
middleFlip[Math.floor(ciphertext.length / 2)] ^= 0x80;
testTamperDetection("Flip bit in middle", middleFlip);

// Test 3: Flip bit in authentication tag (last 16 bytes)
console.log("=== Test 2: Tamper with Authentication Tag ===");
const tagFlip = new Uint8Array(ciphertext);
tagFlip[ciphertext.length - 1] ^= 0x01; // Flip bit in last byte (part of tag)
testTamperDetection("Flip bit in auth tag", tagFlip);

// Test 4: Truncation attack
console.log("=== Test 3: Truncation Attack ===");
const truncated = ciphertext.slice(0, ciphertext.length - 1);
testTamperDetection("Remove last byte", truncated);

const halfTruncated = ciphertext.slice(0, Math.floor(ciphertext.length / 2));
testTamperDetection("Remove half of ciphertext", halfTruncated);

// Test 5: Extension attack
console.log("=== Test 4: Extension Attack ===");
const extended = new Uint8Array(ciphertext.length + 10);
extended.set(ciphertext, 0);
extended.set(
	new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]),
	ciphertext.length,
);
testTamperDetection("Append 10 bytes", extended);

// Test 6: Replace entire ciphertext with zeros
console.log("=== Test 5: Replace with Zeros ===");
const zeros = new Uint8Array(ciphertext.length);
testTamperDetection("All zeros (same length)", zeros);

// Test 7: Swap bytes
console.log("=== Test 6: Swap Bytes ===");
const swapped = new Uint8Array(ciphertext);
const temp = swapped[0];
swapped[0] = swapped[1];
swapped[1] = temp;
testTamperDetection("Swap first two bytes", swapped);

// Statistical analysis: Every modification is detected
console.log("=== Statistical Test: Random Modifications ===");
let detected = 0;
const trials = 1000;

for (let i = 0; i < trials; i++) {
	const modified = new Uint8Array(ciphertext);
	const pos = Math.floor(Math.random() * ciphertext.length);
	modified[pos] ^= 1 << Math.floor(Math.random() * 8); // Random bit flip

	try {
		ChaCha20Poly1305.decrypt(modified, key, nonce);
	} catch {
		detected++;
	}
}

console.log(`Trials: ${trials}`);
console.log(`Detected: ${detected}`);
console.log(`Detection rate: ${((detected / trials) * 100).toFixed(2)}%`);
console.log(
	"\nNote: 100% detection rate is expected. The Poly1305 MAC provides",
);
console.log("~2^-128 probability of a forged message being accepted.");
