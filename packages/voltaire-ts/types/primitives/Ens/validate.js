import { ens_normalize } from "@adraffy/ens-normalize";
import { DisallowedCharacterError } from "./errors.js";
/**
 * Validate ENS name (throws if invalid)
 * @param {string} name - ENS name to validate
 * @throws {DisallowedCharacterError} If ENS name is invalid
 */
export function validate(name) {
    if (typeof name !== "string" || name.length === 0) {
        throw new DisallowedCharacterError({
            value: String(name),
            docsPath: "/primitives/ens/validate",
        });
    }
    try {
        ens_normalize(name);
    }
    catch (err) {
        throw new DisallowedCharacterError({
            value: name,
            docsPath: "/primitives/ens/validate",
            cause: /** @type {Error} */ (err),
        });
    }
}
