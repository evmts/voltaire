/**
 * @module BuilderBid
 *
 * @description
 * MEV builder bid for block construction proposals.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BuilderBid from 'voltaire-effect/primitives/BuilderBid'
 *
 * function evaluateBid(bid: BuilderBid.BuilderBidType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `BuilderBidSchema` | BuilderBidInput | BuilderBidType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as BuilderBid from 'voltaire-effect/primitives/BuilderBid'
 * import * as S from 'effect/Schema'
 *
 * const bid = S.decodeSync(BuilderBid.BuilderBidSchema)(input)
 * ```
 *
 * @since 0.1.0
 */
export {
	type BuilderBidInput,
	BuilderBidSchema,
	type BuilderBidType,
} from "./BuilderBidSchema.js";
