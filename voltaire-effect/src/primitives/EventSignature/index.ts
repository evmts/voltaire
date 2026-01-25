/**
 * @module EventSignature
 * @description Effect Schemas for EVM event signatures (topic 0).
 *
 * Event signatures are 32-byte keccak256 hashes of event definitions.
 * They appear as topic 0 in event logs.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 *
 * function filterLogs(eventSig: EventSignature.EventSignatureType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `EventSignature.String` | signature string | EventSignatureType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as S from 'effect/Schema'
 *
 * // From event definition
 * const sig = S.decodeSync(EventSignature.String)('Transfer(address,address,uint256)')
 *
 * // To hex
 * const hex = S.encodeSync(EventSignature.String)(sig)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * EventSignature.toHex(sig)  // string
 * EventSignature.equals(a, b)  // boolean
 * ```
 *
 * @since 0.1.0
 */
export {
	equals,
	type EventSignatureLike,
	EventSignatureSchema,
	type EventSignatureType,
	String,
	toHex,
} from "./String.js";
