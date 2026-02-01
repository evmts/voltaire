/**
 * Validate a SIWE message structure and timestamps
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @param {import('./SiweMessageType.js').SiweMessageType} message - Message to validate
 * @param {Object} [options] - Validation options
 * @param {Date} [options.now] - Current time for timestamp checks (defaults to now)
 * @returns {import('./SiweMessageType.js').ValidationResult} Validation result with error details if invalid
 * @throws {never}
 * @example
 * ```javascript
 * import * as Siwe from './primitives/Siwe/index.js';
 * const result = Siwe.validate(message);
 * if (!result.valid) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validate(message: import("./SiweMessageType.js").SiweMessageType, options?: {
    now?: Date | undefined;
}): import("./SiweMessageType.js").ValidationResult;
//# sourceMappingURL=validate.d.ts.map