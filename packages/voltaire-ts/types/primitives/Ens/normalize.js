import { ens_normalize } from "@adraffy/ens-normalize";
import { DisallowedCharacterError } from "./errors.js";
/**
 * Normalize ENS name to canonical lowercase form per ENSIP-15
 * @param {import('./EnsType.js').EnsType} name - ENS name to normalize
 * @returns {import('./EnsType.js').EnsType}
 * @throws {DisallowedCharacterError} If ENS name contains disallowed characters
 */
export function normalize(name) {
    try {
        const normalized = ens_normalize(name);
        return /** @type {import('./EnsType.js').EnsType} */ (normalized);
    }
    catch (err) {
        throw new DisallowedCharacterError({
            value: name,
            docsPath: "/primitives/ens/normalize#error-handling",
            cause: /** @type {Error} */ (err),
        });
    }
}
