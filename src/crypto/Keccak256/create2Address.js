import { InvalidLengthError } from "../../primitives/errors/ValidationError.js";
import { hash } from "./hash.js";

/**
 * Compute CREATE2 address
 *
 * Uses CREATE2 formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} sender - Deployer address (20 bytes)
 * @param {Uint8Array} salt - 32-byte salt
 * @param {Uint8Array} initCodeHash - Hash of initialization code
 * @returns {Uint8Array} Contract address (20 bytes)
 * @throws {InvalidLengthError} If sender is not 20 bytes
 * @throws {InvalidLengthError} If salt is not 32 bytes
 * @throws {InvalidLengthError} If initCodeHash is not 32 bytes
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const sender = new Uint8Array(20);
 * const salt = new Uint8Array(32);
 * const initCodeHash = new Uint8Array(32);
 * const address = Keccak256.create2Address(sender, salt, initCodeHash);
 * ```
 */
export function create2Address(sender, salt, initCodeHash) {
	if (sender.length !== 20) {
		throw new InvalidLengthError("Sender must be 20 bytes", {
			code: "KECCAK256_INVALID_SENDER_LENGTH",
			value: sender,
			expected: "20 bytes",
			context: { length: sender.length },
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	if (salt.length !== 32) {
		throw new InvalidLengthError("Salt must be 32 bytes", {
			code: "KECCAK256_INVALID_SALT_LENGTH",
			value: salt,
			expected: "32 bytes",
			context: { length: salt.length },
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	if (initCodeHash.length !== 32) {
		throw new InvalidLengthError("Init code hash must be 32 bytes", {
			code: "KECCAK256_INVALID_INIT_CODE_HASH_LENGTH",
			value: initCodeHash,
			expected: "32 bytes",
			context: { length: initCodeHash.length },
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	const data = new Uint8Array(1 + 20 + 32 + 32);
	data[0] = 0xff;
	data.set(sender, 1);
	data.set(salt, 21);
	data.set(initCodeHash, 53);
	const digest = hash(data);
	return digest.slice(12);
}
