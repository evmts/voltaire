import * as Hash from "../Hash/index.js";
import * as Rlp from "../Rlp/index.js";
import { InvalidValueError } from "./errors.js";

/**
 * Calculate CREATE contract address
 *
 * address = keccak256(rlp([sender, nonce]))[12:32]
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Sender address
 * @param {bigint} nonce - Transaction nonce
 * @returns {import('./BrandedAddress.js').BrandedAddress} Calculated contract address
 * @throws {InvalidValueError} If nonce is negative
 *
 * @example
 * ```typescript
 * const contractAddr = Address.calculateCreateAddress(deployerAddr, 5n);
 * ```
 */
export function calculateCreateAddress(address, nonce) {
	if (nonce < 0n) {
		throw new InvalidValueError("Nonce cannot be negative");
	}

	let nonceBytes;
	if (nonce === 0n) {
		nonceBytes = new Uint8Array(0);
	} else {
		const hex = nonce.toString(16);
		const hexPadded = hex.length % 2 === 0 ? hex : `0${hex}`;
		const byteLength = hexPadded.length / 2;
		nonceBytes = new Uint8Array(byteLength);
		for (let i = 0; i < byteLength; i++) {
			nonceBytes[i] = Number.parseInt(hexPadded.slice(i * 2, i * 2 + 2), 16);
		}
	}

	const encoded = Rlp.encode.call([address, nonceBytes]);
	const hash = Hash.keccak256(encoded);
	return hash.slice(12, 32);
}
