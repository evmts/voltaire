import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { InvalidValueError } from "./errors.js";

/**
 * Calculate CREATE2 contract address
 *
 * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Sender address
 * @param {bigint | Uint8Array} salt - 32-byte salt or bigint value
 * @param {Uint8Array} initCode - Contract initialization code
 * @returns {import('./BrandedAddress.js').BrandedAddress} Calculated contract address
 * @throws {InvalidValueError} If salt is negative bigint
 * @throws {Error} If salt Uint8Array is not 32 bytes
 *
 * @example
 * ```typescript
 * const contractAddr = Address.calculateCreate2Address(
 *   deployerAddr,
 *   saltBytes,
 *   initCode
 * );
 * ```
 */
export function calculateCreate2Address(address, salt, initCode) {
	// Convert salt to bytes
	let saltBytes;
	if (typeof salt === "bigint") {
		if (salt < 0n) {
			throw new InvalidValueError("Salt cannot be negative");
		}
		saltBytes = new Uint8Array(32);
		let s = salt;
		for (let i = 31; i >= 0; i--) {
			saltBytes[i] = Number(s & 0xffn);
			s >>= 8n;
		}
	} else if (salt instanceof Uint8Array) {
		if (salt.length !== 32) {
			throw new Error("Salt must be 32 bytes");
		}
		saltBytes = salt;
	} else {
		throw new Error("Salt must be bigint or Uint8Array");
	}

	// Hash init code
	const initCodeHash = keccak256(initCode);

	// Concatenate: 0xff ++ address ++ salt ++ initCodeHash
	const data = new Uint8Array(1 + 20 + 32 + 32);
	data[0] = 0xff;
	data.set(address, 1);
	data.set(saltBytes, 21);
	data.set(initCodeHash, 53);

	// Hash and take last 20 bytes
	const hash = keccak256(data);
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		hash.slice(12)
	);
}
