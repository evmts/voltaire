/**
 * @module Permit
 * @description Effect Schemas for ERC-2612 gasless token approvals.
 *
 * Provides validation for ERC-2612 permits, enabling gasless token approvals
 * via EIP-712 typed signatures.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Permit from 'voltaire-effect/primitives/Permit'
 *
 * function executePermit(permit: Permit.PermitType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Description |
 * |--------|-------------|
 * | `Permit.Struct` | Permit data (owner, spender, value, nonce, deadline) |
 * | `Permit.DomainStruct` | EIP-712 domain for permit signatures |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Permit from 'voltaire-effect/primitives/Permit'
 * import * as S from 'effect/Schema'
 *
 * // Validate permit data
 * const permit = S.decodeSync(Permit.Struct)({
 *   owner: ownerAddress,
 *   spender: spenderAddress,
 *   value: 1000000000000000000n,
 *   nonce: 0n,
 *   deadline: 1700000000n
 * })
 *
 * // Validate domain
 * const domain = S.decodeSync(Permit.DomainStruct)({
 *   name: 'USD Coin',
 *   version: '2',
 *   chainId: 1n,
 *   verifyingContract: usdcAddress
 * })
 * ```
 *
 * @since 0.1.0
 */
export {
	DomainStruct,
	type PermitDomainType,
	PermitDomainTypeSchema,
	type PermitType,
	PermitTypeSchema,
	Struct,
} from "./Struct.js";
