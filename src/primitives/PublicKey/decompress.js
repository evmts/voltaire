
/**
 * Decompress a public key from 33 bytes (compressed) to 64 bytes (uncompressed)
 *
 * Solves y² = x³ + 7 mod p and chooses y based on prefix parity
 *
 * @param {Uint8Array} compressed - Compressed public key (33 bytes with 0x02/0x03 prefix)
 * @returns {import('./PublicKeyType.js').PublicKeyType} Uncompressed public key (64 bytes)
 * @throws {Error} If compressed format is invalid
 *
 * @example
 * ```javascript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 * const uncompressed = PublicKey._decompress(compressed);
 * ```
 */
export function decompress(compressed) {
	// Validate length
	if (compressed.length !== 33) {
		throw new Error(
			`Invalid compressed public key length: expected 33 bytes, got ${compressed.length}`,
		);
	}

	// Validate prefix
	const prefix = /** @type {number} */ (compressed[0]);
	if (prefix !== 0x02 && prefix !== 0x03) {
		throw new Error(
			`Invalid compressed public key prefix: expected 0x02 or 0x03, got 0x${prefix.toString(16).padStart(2, "0")}`,
		);
	}

	// secp256k1 field prime
	const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;

	// Parse x coordinate
	let x = 0n;
	for (let i = 1; i < 33; i++) {
		x = (x << 8n) | BigInt(/** @type {number} */ (compressed[i]));
	}

	// Validate x is in field
	if (x >= P) {
		throw new Error("Invalid x-coordinate: must be less than field prime");
	}

	// Calculate y² = x³ + 7 mod p
	const x3 = modExp(x, 3n, P);
	const y2 = (x3 + 7n) % P;

	// Calculate y = y²^((p+1)/4) mod p (works because p ≡ 3 mod 4)
	const yCandidate = modExp(y2, (P + 1n) >> 2n, P);

	// Verify y is correct
	if ((yCandidate * yCandidate) % P !== y2) {
		throw new Error("Invalid compressed public key: no valid y-coordinate");
	}

	// Choose correct y based on prefix parity
	const yIsOdd = (yCandidate & 1n) === 1n;
	const prefixIsOdd = prefix === 0x03;
	const y = yIsOdd === prefixIsOdd ? yCandidate : P - yCandidate;

	// Convert to 64 byte uncompressed format
	const result = new Uint8Array(64);

	// Write x coordinate (32 bytes, big-endian)
	for (let i = 31; i >= 0; i--) {
		result[i] = Number(x & 0xffn);
		x >>= 8n;
	}

	// Write y coordinate (32 bytes, big-endian)
	let yTemp = y;
	for (let i = 63; i >= 32; i--) {
		result[i] = Number(yTemp & 0xffn);
		yTemp >>= 8n;
	}

	return /** @type {import('./PublicKeyType.js').PublicKeyType} */ (result);
}

/**
 * Modular exponentiation: (base^exp) % mod
 * @param {bigint} base
 * @param {bigint} exp
 * @param {bigint} mod
 * @returns {bigint}
 */
function modExp(base, exp, mod) {
	let result = 1n;
	base = base % mod;

	while (exp > 0n) {
		if (exp & 1n) {
			result = (result * base) % mod;
		}
		exp >>= 1n;
		base = (base * base) % mod;
	}

	return result;
}
