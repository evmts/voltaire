import { Permit } from '@tevm/voltaire'
import * as S from 'effect/Schema'

/**
 * Type representing an ERC-2612 permit for gasless token approvals.
 * @since 0.0.1
 */
export type PermitType = Permit.PermitType

/**
 * Type representing the EIP-712 domain for permit signatures.
 * @since 0.0.1
 */
export type PermitDomainType = Permit.PermitDomainType

/**
 * Effect Schema for validating permit data.
 *
 * Validates the permit structure including owner, spender, value, nonce, and deadline.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PermitTypeSchema } from 'voltaire-effect/primitives/Permit'
 *
 * const permit = S.decodeSync(PermitTypeSchema)({
 *   owner: ownerAddress,
 *   spender: spenderAddress,
 *   value: 1000000000000000000n,
 *   nonce: 0n,
 *   deadline: 1700000000n
 * })
 * ```
 *
 * @since 0.0.1
 */
export const PermitTypeSchema = S.Struct({
  owner: S.Uint8ArrayFromSelf,
  spender: S.Uint8ArrayFromSelf,
  value: S.BigIntFromSelf,
  nonce: S.BigIntFromSelf,
  deadline: S.BigIntFromSelf,
}).annotations({ identifier: 'PermitType' })

/**
 * Effect Schema for validating EIP-712 permit domain.
 *
 * Validates the domain separator fields required for permit signatures.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PermitDomainTypeSchema } from 'voltaire-effect/primitives/Permit'
 *
 * const domain = S.decodeSync(PermitDomainTypeSchema)({
 *   name: 'USD Coin',
 *   version: '2',
 *   chainId: 1n,
 *   verifyingContract: usdcAddress
 * })
 * ```
 *
 * @since 0.0.1
 */
export const PermitDomainTypeSchema = S.Struct({
  name: S.String,
  version: S.String,
  chainId: S.BigIntFromSelf,
  verifyingContract: S.Uint8ArrayFromSelf,
}).annotations({ identifier: 'PermitDomainType' })

/**
 * Default schema export for permit validation.
 * @since 0.0.1
 */
export const Schema = PermitTypeSchema
