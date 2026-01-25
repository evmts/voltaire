/**
 * @module Paymaster
 * @description ERC-4337 Paymaster configurations for sponsored transactions.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 *
 * function sponsorTransaction(paymaster: Paymaster.PaymasterType) {
 *   // ...
 * }
 * ```
 *
 * @since 0.0.1
 */
export {
	type PaymasterInput,
	PaymasterSchema,
	type PaymasterType,
} from "./PaymasterSchema.js";
