import { SECP256K1_HALF_N, SECP256K1_N } from "./constants.js";
import {
	InvalidAddressError,
	InvalidChainIdError,
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
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth - Authorization to validate
 * @throws {InvalidChainIdError} if chainId is zero
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
	// Chain ID must be non-zero
	if (auth.chainId === 0n) {
		throw new InvalidChainIdError(auth.chainId);
	}

	// Address must not be zero
	if (Array.from(auth.address).every((byte) => byte === 0)) {
		throw new InvalidAddressError(auth.address);
	}

	// yParity must be 0 or 1
	if (auth.yParity !== 0 && auth.yParity !== 1) {
		throw new InvalidYParityError(auth.yParity);
	}

	// r and s must be non-zero
	if (auth.r === 0n) {
		throw new InvalidSignatureComponentError("r", auth.r);
	}
	if (auth.s === 0n) {
		throw new InvalidSignatureComponentError("s", auth.s);
	}

	// r must be < N
	if (auth.r >= SECP256K1_N) {
		throw new InvalidSignatureRangeError(auth.r, SECP256K1_N);
	}

	// s must be <= N/2 (no malleable signatures)
	if (auth.s > SECP256K1_HALF_N) {
		throw new MalleableSignatureError(auth.s, SECP256K1_HALF_N);
	}
}
