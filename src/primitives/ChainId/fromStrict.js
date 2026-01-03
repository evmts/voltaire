import { ValidationError } from "../errors/ValidationError.js";
import { from } from "./from.js";
import { KNOWN_CHAINS, CHAIN_NAMES } from "./knownChains.js";

/**
 * Create ChainId from number with strict validation
 * Warns or throws for unknown chain IDs
 *
 * @param {number} value - Chain ID number
 * @param {{ mode?: 'warn' | 'throw' }} [options] - Validation options
 * @returns {import('./ChainIdType.js').ChainIdType} Branded chain ID
 * @throws {ValidationError} If mode is 'throw' and chain ID is unknown
 *
 * @example
 * ```typescript
 * // Warn mode (default) - logs warning but returns value
 * const chain = ChainId.fromStrict(999999); // logs warning
 *
 * // Throw mode - throws for unknown chains
 * const chain = ChainId.fromStrict(999999, { mode: 'throw' }); // throws
 *
 * // Known chains work normally
 * const mainnet = ChainId.fromStrict(1); // no warning
 * ```
 */
export function fromStrict(value, options = {}) {
	const chainId = from(value);
	const mode = options.mode ?? "warn";

	if (!KNOWN_CHAINS.has(value)) {
		const knownList = Array.from(CHAIN_NAMES.entries())
			.map(([id, name]) => `${id} (${name})`)
			.join(", ");

		const message = `Unknown chain ID: ${value}. Known chains: ${knownList}`;

		if (mode === "throw") {
			throw new ValidationError(message, {
				value,
				expected: `One of: ${knownList}`,
				code: "CHAIN_ID_UNKNOWN",
				docsPath: "/primitives/chain-id/from-strict#error-handling",
			});
		}

		// Warn mode
		console.warn(`[ChainId] ${message}`);
	}

	return chainId;
}
