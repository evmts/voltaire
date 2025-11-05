import { SECP256K1_HALF_N, SECP256K1_N } from "./constants.js";
import { ValidationError } from "./errors.js";

/**
 * Validate authorization structure
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth - Authorization to validate
 * @throws {ValidationError} if invalid
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * try {
 *   validate(auth);
 * } catch (e) {
 *   if (e instanceof ValidationError) {
 *     console.error(e.message);
 *   }
 * }
 * ```
 */
export function validate(auth) {
	// Chain ID must be non-zero
	if (auth.chainId === 0n) {
		throw new ValidationError("Chain ID must be non-zero");
	}

	// Address must not be zero
	if (Array.from(auth.address).every((byte) => byte === 0)) {
		throw new ValidationError("Address cannot be zero address");
	}

	// yParity must be 0 or 1
	if (auth.yParity !== 0 && auth.yParity !== 1) {
		throw new ValidationError("yParity must be 0 or 1");
	}

	// r and s must be non-zero
	if (auth.r === 0n) {
		throw new ValidationError("Signature r cannot be zero");
	}
	if (auth.s === 0n) {
		throw new ValidationError("Signature s cannot be zero");
	}

	// r must be < N
	if (auth.r >= SECP256K1_N) {
		throw new ValidationError("Signature r must be less than curve order");
	}

	// s must be <= N/2 (no malleable signatures)
	if (auth.s > SECP256K1_HALF_N) {
		throw new ValidationError("Signature s too high (malleable signature)");
	}
}
