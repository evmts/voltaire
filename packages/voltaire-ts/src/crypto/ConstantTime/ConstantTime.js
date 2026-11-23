/**
 * Constant-time helpers for secret-dependent comparisons.
 *
 * JavaScript gives no hard timing guarantees (JIT, GC), but these helpers
 * remove the data-dependent early exits that make `===`, `Array.every`, and
 * `Buffer.compare` trivially exploitable.
 *
 * @module
 */

import { constantTimeEqual } from "./constantTimeEqual.js";
import { constantTimeIsValidScalar } from "./constantTimeIsValidScalar.js";
import { constantTimeIsZero } from "./constantTimeIsZero.js";

export { constantTimeEqual, constantTimeIsValidScalar, constantTimeIsZero };

/**
 * ConstantTime namespace
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { ConstantTime } from './crypto/ConstantTime/index.js';
 * ConstantTime.constantTimeEqual(tagA, tagB);
 * ConstantTime.equal(tagA, tagB); // alias
 * ConstantTime.isZero(sharedSecret);
 * ConstantTime.isValidScalar(privateKey, orderBytes);
 * ```
 */
export const ConstantTime = {
	constantTimeEqual,
	constantTimeIsValidScalar,
	constantTimeIsZero,
	equal: constantTimeEqual,
	isValidScalar: constantTimeIsValidScalar,
	isZero: constantTimeIsZero,
};
