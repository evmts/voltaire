import { COMMITMENT_VERSION_KZG } from "./constants.js";

/**
 * Validate versioned hash
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').VersionedHash} hash - Versioned hash
 * @returns {boolean} true if version byte is correct
 * @throws {never}
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * if (!Blob.isValidVersion(hash)) {
 *   throw new Error("Invalid version");
 * }
 * ```
 */
export function isValidVersion(hash) {
	return hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG;
}
