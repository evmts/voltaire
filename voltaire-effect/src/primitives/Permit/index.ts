/**
 * Permit module for Effect-based ERC-2612 gasless token approvals.
 *
 * Provides Effect-wrapped operations for working with ERC-2612 permits,
 * enabling gasless token approvals via EIP-712 typed signatures.
 *
 * @example
 * ```typescript
 * import * as Permit from 'voltaire-effect/primitives/Permit'
 * import * as Effect from 'effect/Effect'
 *
 * const permit = Permit.from({
 *   owner: '0x1234...',
 *   spender: '0xabcd...',
 *   value: 1000000000000000000n,
 *   nonce: 0n,
 *   deadline: 1700000000n
 * })
 *
 * Effect.runSync(permit)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, PermitTypeSchema, PermitDomainTypeSchema, type PermitType, type PermitDomainType } from './PermitSchema.js'
export { from, PermitError, type PermitInput } from './from.js'
