import { SECP256K1_HALF_N, SECP256K1_N } from "./constants.js";
import {
	InvalidAddressError,
	InvalidSignatureComponentError,
	InvalidSignatureRangeError,
	InvalidYParityError,
	MalleableSignatureError,
} from "./errors.js";

/**
 * Validate authorization structure
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("./AuthorizationType.js").AuthorizationType} auth - Authorization to validate
 * @throws {InvalidAddressError} if address is zero address
 * @throws {InvalidYParityError} if yParity is not 0 or 1
 * @throws {InvalidSignatureComponentError} if r or s is zero
 * @throws {InvalidSignatureRangeError} if r >= curve order
 * @throws {MalleableSignatureError} if s > N/2 (malleable signature)
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const auth = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * try {
 *   Authorization.validate(auth);
 * } catch (e) {
 *   console.error('Invalid authorization:', e.message);
 * }
 * ```
 */
export function validate(auth) {
	// Note: chainId=0 is valid per EIP-7702 (cross-chain authorization)

	// Address must not be zero
	if (Array.from(auth.address).every((byte) => byte === 0)) {
		throw new InvalidAddressError(auth.address);
	}

	// yParity must be 0 or 1
	if (auth.yParity !== 0 && auth.yParity !== 1) {
		throw new InvalidYParityError(auth.yParity);
	}

	// Convert r and s to bigint for comparison (handle both bigint and Uint8Array)
	const rBigInt = typeof auth.r === "bigint" ? auth.r : bytesToBigInt(auth.r);
	const sBigInt = typeof auth.s === "bigint" ? auth.s : bytesToBigInt(auth.s);

	// r and s must be non-zero
	if (rBigInt === 0n) {
		throw new InvalidSignatureComponentError("r", rBigInt);
	}
	if (sBigInt === 0n) {
		throw new InvalidSignatureComponentError("s", sBigInt);
	}

	// r must be < N
	if (rBigInt >= SECP256K1_N) {
		throw new InvalidSignatureRangeError(rBigInt, SECP256K1_N);
	}

	// s must be <= N/2 (no malleable signatures)
	if (sBigInt > SECP256K1_HALF_N) {
		throw new MalleableSignatureError(sBigInt, SECP256K1_HALF_N);
	}
}

/**
 * Convert Uint8Array to bigint
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
function bytesToBigInt(bytes) {
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(/** @type {number} */ (bytes[i]));
	}
	return result;
}
