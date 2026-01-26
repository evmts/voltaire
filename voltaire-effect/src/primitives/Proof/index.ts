/**
 * @module Proof
 * @description Ethereum state proof structure for account/storage verification.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Proof from 'voltaire-effect/primitives/Proof'
 *
 * function verifyProof(proof: Proof.ProofType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Schema` | Proof input | ProofType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Proof from 'voltaire-effect/primitives/Proof'
 * import * as S from 'effect/Schema'
 *
 * const proof = S.decodeSync(Proof.Schema)(input)
 * ```
 *
 * @since 0.1.0
 */
export { Schema } from "./Struct.js";

/**
 * Merkle proof type - array of 32-byte hashes representing a proof path.
 */
export type ProofType = readonly Uint8Array[];
