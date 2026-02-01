/**
 * BN254 Error Types
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 */
/**
 * Base error for BN254 operations
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254Error } from './crypto/bn254/errors.js';
 * throw new Bn254Error('Operation failed', {
 *   code: -32000,
 *   context: { operation: 'multiply' },
 *   docsPath: '/crypto/bn254#error-handling'
 * });
 * ```
 */
export class Bn254Error extends CryptoError {
}
/**
 * Error for invalid point on curve
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254InvalidPointError } from './crypto/bn254/errors.js';
 * throw new Bn254InvalidPointError('Point not on curve', {
 *   context: { x: '0x...', y: '0x...' },
 *   docsPath: '/crypto/bn254/g1#validation'
 * });
 * ```
 */
export class Bn254InvalidPointError extends Bn254Error {
}
/**
 * Error for point not in correct subgroup
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254SubgroupCheckError } from './crypto/bn254/errors.js';
 * throw new Bn254SubgroupCheckError('Point not in subgroup', {
 *   context: { point: '...' },
 *   docsPath: '/crypto/bn254/g2#subgroup-check'
 * });
 * ```
 */
export class Bn254SubgroupCheckError extends Bn254Error {
}
import { CryptoError } from "../../primitives/errors/CryptoError.js";
//# sourceMappingURL=errors.d.ts.map