/**
 * @module Proof
 * @description Ethereum state proof structure for account/storage verification.
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
import type { Proof } from "@tevm/voltaire";

export type ProofType = Proof.ProofType;
export { Schema } from "./Struct.js";
