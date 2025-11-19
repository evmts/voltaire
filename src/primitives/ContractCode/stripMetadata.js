import { hasMetadata } from "./hasMetadata.js";

/**
 * Strip CBOR metadata from contract code
 *
 * Returns runtime code without the Solidity compiler metadata.
 *
 * @param {import('./ContractCodeType.js').ContractCodeType} code - ContractCode with metadata
 * @returns {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} RuntimeCode without metadata
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const withMeta = ContractCode.from("0x6001600155a264...0033");
 * const runtime = ContractCode._stripMetadata(withMeta);
 * ```
 */
export function stripMetadata(code) {
	if (!hasMetadata(code)) {
		return /** @type {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} */ (
			code
		);
	}

	// Last 2 bytes: 0x00 + metadata_length
	const metadataLength = (code[code.length - 1] ?? 0) + 2;
	return /** @type {import('../RuntimeCode/RuntimeCodeType.js').RuntimeCodeType} */ (
		code.slice(0, -metadataLength)
	);
}
