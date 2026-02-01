import { InvalidLengthError } from "../errors/ValidationError.js";

/**
 * Factory function to create calculateCreate2Address with injected keccak256 dependency
 *
 * @param {Object} deps - Dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {function(import('./AddressType.js').AddressType, import('../Hash/HashType.js').HashType, import('../Bytecode/BytecodeType.js').BrandedBytecode): import('./AddressType.js').AddressType}
 */
export function CalculateCreate2Address({ keccak256 }) {
	/**
	 * Calculate CREATE2 contract address
	 *
	 * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
	 *
	 * @param {import('./AddressType.js').AddressType} address - Sender address
	 * @param {import('../Hash/HashType.js').HashType} salt - 32-byte salt (use Hash.from to create)
	 * @param {import('../Bytecode/BytecodeType.js').BrandedBytecode} initCode - Contract initialization code
	 * @returns {import('./AddressType.js').AddressType} Calculated contract address
	 * @throws {InvalidLengthError} If salt is not exactly 32 bytes
	 *
	 * @example
	 * ```typescript
	 * import { hash } from '../../../crypto/Keccak256/hash.js';
	 * import * as Hash from './primitives/Hash/index.js';
	 * import * as Bytecode from './primitives/Bytecode/index.js';
	 *
	 * const calculateCreate2Address = CalculateCreate2Address({ keccak256: hash });
	 * const salt = Hash.from(245n);
	 * const initCode = Bytecode.from("0x6080...");
	 * const contractAddr = calculateCreate2Address(
	 *   deployerAddr,
	 *   salt,
	 *   initCode
	 * );
	 * ```
	 */
	return function calculateCreate2Address(address, salt, initCode) {
		// Validate salt is exactly 32 bytes
		if (salt.length !== 32) {
			throw new InvalidLengthError("Salt must be exactly 32 bytes", {
				code: -32602,
				value: salt,
				expected: "32 bytes",
				context: { length: salt.length },
				docsPath:
					"/primitives/address/calculate-create2-address#error-handling",
			});
		}

		// Hash init code
		const initCodeHash = keccak256(initCode);

		// Concatenate: 0xff ++ address ++ salt ++ initCodeHash
		const data = new Uint8Array(1 + 20 + 32 + 32);
		data[0] = 0xff;
		data.set(address, 1);
		data.set(salt, 21);
		data.set(initCodeHash, 53);

		// Hash and take last 20 bytes
		const hash = keccak256(data);
		return /** @type {import('./AddressType.js').AddressType} */ (
			hash.slice(12)
		);
	};
}
