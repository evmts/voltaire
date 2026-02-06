/**
 * Generate random valid blob (for testing)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {number} [seed] - Optional seed for deterministic generation
 * @returns {Uint8Array} Random blob with valid field elements
 * @throws {KzgError} If crypto.getRandomValues not available
 * @example
 * ```javascript
 * import { generateRandomBlob } from './crypto/KZG/index.js';
 * const blob = generateRandomBlob();
 * const deterministicBlob = generateRandomBlob(12345);
 * ```
 */
export function generateRandomBlob(seed?: number): Uint8Array;
//# sourceMappingURL=generateRandomBlob.d.ts.map