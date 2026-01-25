/**
 * @module FunctionSignature
 * @description Effect Schemas for Solidity function signatures.
 *
 * Function signatures are the canonical representation of Solidity function definitions,
 * like "transfer(address,uint256)" or "balanceOf(address)".
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 *
 * function encodeCall(sig: FunctionSignature.FunctionSignatureType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `FunctionSignature.String` | signature string | FunctionSignatureType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 * import * as S from 'effect/Schema'
 *
 * const sig = S.decodeSync(FunctionSignature.String)('transfer(address,uint256)')
 * console.log(sig.name)       // 'transfer'
 * console.log(sig.selector)   // Uint8Array [0xa9, 0x05, 0x9c, 0xbb]
 * ```
 *
 * @since 0.1.0
 */
export {
	type FunctionSignatureType,
	Schema,
	String,
} from "./String.js";
