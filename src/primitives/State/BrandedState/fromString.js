/**
 * Parse a StorageKey from its string representation
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {string} str - String representation from toString()
 * @returns {import('./BrandedStorageKey.js').BrandedStorageKey | undefined} Parsed StorageKey or undefined if invalid
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = State.fromString(str);
 * if (key) {
 *   // Use key
 * }
 * ```
 */
export function fromString(str) {
	const parts = str.split("_");
	if (parts.length !== 2) return undefined;

	const addrHex = parts[0];
	const slotHex = parts[1];
	if (!addrHex || !slotHex) return undefined;
	if (addrHex.length !== 40 || slotHex.length !== 64) return undefined;

	// Validate hex characters
	if (!/^[0-9a-fA-F]+$/.test(addrHex) || !/^[0-9a-fA-F]+$/.test(slotHex)) {
		return undefined;
	}

	try {
		const address = new Uint8Array(20);
		for (let i = 0; i < 20; i++) {
			address[i] = Number.parseInt(addrHex.slice(i * 2, i * 2 + 2), 16);
		}

		const slot = BigInt(`0x${slotHex}`);

		return {
			address:
				/** @type {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
					address
				),
			slot,
		};
	} catch {
		return undefined;
	}
}
