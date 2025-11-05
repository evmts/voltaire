import { keccak256 } from "../../Hash/BrandedHash/keccak256.js";
import { SIZE } from "./constants.js";
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
	// Normalize salt to Uint8Array(32)
	let saltBytes;
	if (typeof salt === "bigint") {
		if (salt < 0n) {
			throw new InvalidValueError("Salt cannot be negative");
		}
		saltBytes = new Uint8Array(32);
		for (let i = 31; i >= 0; i--) {
			saltBytes[i] = Number(salt & 0xffn);
			salt = salt >> 8n;
		}
	} else {
		saltBytes = salt;
		if (saltBytes.length !== 32) {
			throw new Error("Salt must be 32 bytes");
		}
	}

	const initCodeHash = keccak256(initCode);
	const data = new Uint8Array(1 + SIZE + 32 + 32);
	data[0] = 0xff;
	data.set(address, 1);
	data.set(saltBytes, 1 + SIZE);
	data.set(initCodeHash, 1 + SIZE + 32);

	const hash = keccak256(data);
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		hash.slice(12, 32)
	);
}
