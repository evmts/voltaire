/**
 * @fileoverview FunctionSignature module for parsing Solidity function signatures.
 * @module FunctionSignature
 * @since 0.0.1
 *
 * @description
 * Function signatures are the canonical representation of Solidity function definitions.
 * They consist of the function name followed by the parameter types in parentheses,
 * such as "transfer(address,uint256)" or "balanceOf(address)".
 *
 * This module provides:
 * - Parsing of function signature strings
 * - Extraction of function names
 * - Computation of 4-byte selectors
 * - Effect Schema for validation
 *
 * @example
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Parse with Effect
 * const sig = Effect.runSync(FunctionSignature.from('transfer(address,uint256)'))
 * console.log(sig.name)       // 'transfer'
 * console.log(sig.signature)  // 'transfer(address,uint256)'
 * console.log(sig.selector)   // Uint8Array [0xa9, 0x05, 0x9c, 0xbb]
 *
 * // Parse with Schema
 * const parsed = S.decodeSync(FunctionSignature.Schema)('balanceOf(address)')
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const sig = yield* FunctionSignature.from('approve(address,uint256)')
 *   console.log(`Parsing ${sig.name} with selector`)
 *   return sig
 * })
 * ```
 *
 * @see {@link Schema} for Effect Schema integration
 * @see {@link from} for Effect-based creation
 * @see {@link FunctionSignatureError} for error handling
 */
export { Schema, type FunctionSignatureType } from './FunctionSignatureSchema.js'
export { from, fromSignature, FunctionSignatureError } from './from.js'
