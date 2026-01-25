/**
 * ValidatorIndex module for beacon chain validator identification.
 *
 * Validator indices are assigned sequentially as validators join the beacon chain.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as ValidatorIndex from 'voltaire-effect/primitives/ValidatorIndex'
 *
 * function getValidatorBalance(validator: ValidatorIndex.ValidatorIndexType) {
 *   // ...
 * }
 * ```
 *
 * @module ValidatorIndex
 * @since 0.0.1
 */

export { Schema, type ValidatorIndexType } from "./ValidatorIndexSchema.js";
