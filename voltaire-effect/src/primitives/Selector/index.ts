/**
 * @module Selector
 * @description Effect Schemas for EVM function selectors (4-byte identifiers).
 *
 * Selectors are the first 4 bytes of keccak256(signature), used to identify
 * which function to invoke in EVM call data.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 *
 * function matchFunction(selector: Selector.SelectorType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Selector.Hex` | hex string | SelectorType |
 * | `Selector.Bytes` | Uint8Array | SelectorType |
 * | `Selector.Signature` | function signature | SelectorType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const selector = S.decodeSync(Selector.Hex)('0xa9059cbb')
 *
 * // From function signature
 * const transfer = S.decodeSync(Selector.Signature)('transfer(address,uint256)')
 *
 * // Encode back to hex
 * const hex = S.encodeSync(Selector.Hex)(selector)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Selector.equals(a, b)  // boolean
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { equals } from "./equals.js";
export { Hex } from "./Hex.js";
export type { SelectorType } from "./SelectorSchema.js";
export { Signature } from "./Signature.js";
