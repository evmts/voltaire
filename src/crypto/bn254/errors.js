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
 * throw new Bn254Error('Operation failed');
 * ```
 */
export class Bn254Error extends Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "Bn254Error";
	}
}

/**
 * Error for invalid point on curve
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254InvalidPointError } from './crypto/bn254/errors.js';
 * throw new Bn254InvalidPointError('Point not on curve');
 * ```
 */
export class Bn254InvalidPointError extends Bn254Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "Bn254InvalidPointError";
	}
}

/**
 * Error for point not in correct subgroup
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254SubgroupCheckError } from './crypto/bn254/errors.js';
 * throw new Bn254SubgroupCheckError('Point not in subgroup');
 * ```
 */
export class Bn254SubgroupCheckError extends Bn254Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "Bn254SubgroupCheckError";
	}
}
