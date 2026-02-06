/**
 * @module ForwardRequest
 * @description EIP-2771 meta-transaction forward request structure.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `ForwardRequestSchema` | ForwardRequestInput | ForwardRequestType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ForwardRequest from 'voltaire-effect/primitives/ForwardRequest'
 * import * as S from 'effect/Schema'
 *
 * const request = S.decodeSync(ForwardRequest.ForwardRequestSchema)(input)
 * ```
 *
 * @since 0.1.0
 */
export {
	type ForwardRequestInput,
	ForwardRequestSchema,
	type ForwardRequestType,
} from "./ForwardRequestSchema.js";
