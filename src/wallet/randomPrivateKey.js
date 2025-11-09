import { Address } from "../primitives/Address/index.js";

/**
 * Generate a cryptographically secure random Ethereum wallet
 * Uses secp256k1 to generate random private key, derives public key,
 * and returns the address (last 20 bytes of keccak256(pubkey))
 *
 * @returns {import('../primitives/Address/BrandedAddress/BrandedAddress.js').BrandedAddress} Randomly generated address
 *
 * @example
 * ```typescript
 * import { randomPrivateKey } from '@tevm/voltaire/wallet';
 *
 * const randomAddr = randomPrivateKey();
 * console.log(Address.toHex(randomAddr));
 * ```
 */
export function randomPrivateKey() {
	// Use crypto.getRandomValues for secure randomness
	const privateKey = new Uint8Array(32);
	crypto.getRandomValues(privateKey);

	// Convert to bigint for secp256k1 operations
	let privKeyBigInt = 0n;
	for (let i = 0; i < 32; i++) {
		const byte = privateKey[i];
		if (byte === undefined) throw new Error(`Invalid byte at index ${i}`);
		privKeyBigInt = (privKeyBigInt << 8n) | BigInt(byte);
	}

	// Derive public key from private key using secp256k1
	// Using simple point multiplication: P = privKey * G
	const { x, y } = multiplyBasePoint(privKeyBigInt);

	return Address.fromPublicKey(x, y);
}

// secp256k1 parameters
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const Gx = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const Gy = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;

/**
 * Multiply secp256k1 base point G by scalar k
 * @param {bigint} k - Scalar multiplier (private key)
 * @returns {{x: bigint, y: bigint}} Public key point
 */
function multiplyBasePoint(k) {
	// Ensure k is in valid range [1, N-1]
	let scalar = mod(k, N);
	if (scalar === 0n) scalar = 1n;

	let px = Gx;
	let py = Gy;
	let qx = null;
	let qy = null;

	// Double-and-add algorithm
	for (let i = 0n; i < 256n; i++) {
		if ((scalar >> i) & 1n) {
			if (qx === null || qy === null) {
				qx = px;
				qy = py;
			} else {
				[qx, qy] = pointAdd(qx, qy, px, py);
			}
		}
		[px, py] = pointDouble(px, py);
	}

	if (qx === null || qy === null) {
		throw new Error("Point multiplication failed");
	}

	return { x: qx, y: qy };
}

/**
 * Add two points on secp256k1 curve
 * @param {bigint} x1
 * @param {bigint} y1
 * @param {bigint} x2
 * @param {bigint} y2
 * @returns {[bigint, bigint]}
 */
function pointAdd(x1, y1, x2, y2) {
	if (x1 === x2 && y1 === y2) {
		return pointDouble(x1, y1);
	}

	const lam = mod((y2 - y1) * modInv(x2 - x1, P), P);
	const x3 = mod(lam * lam - x1 - x2, P);
	const y3 = mod(lam * (x1 - x3) - y1, P);

	return [x3, y3];
}

/**
 * Double a point on secp256k1 curve
 * @param {bigint} x
 * @param {bigint} y
 * @returns {[bigint, bigint]}
 */
function pointDouble(x, y) {
	const lam = mod(3n * x * x * modInv(2n * y, P), P);
	const x3 = mod(lam * lam - 2n * x, P);
	const y3 = mod(lam * (x - x3) - y, P);

	return [x3, y3];
}

/**
 * Modular multiplicative inverse
 * @param {bigint} a
 * @param {bigint} m
 * @returns {bigint}
 */
function modInv(a, m) {
	const normalizedA = mod(a, m);
	let [t, newT] = [0n, 1n];
	let [r, newR] = [m, normalizedA];

	while (newR !== 0n) {
		const quotient = r / newR;
		[t, newT] = [newT, t - quotient * newT];
		[r, newR] = [newR, r - quotient * newR];
	}

	if (t < 0n) {
		t = t + m;
	}

	return t;
}

/**
 * Modulo operation that always returns positive
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function mod(a, b) {
	const result = a % b;
	return result >= 0n ? result : result + b;
}
