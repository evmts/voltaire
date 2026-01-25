import { Domain, DomainSeparator } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { DomainInput, DomainType } from './DomainSchema.js'

/**
 * Type representing a domain separator hash.
 * @since 0.0.1
 */
export type DomainSeparatorType = ReturnType<typeof DomainSeparator.from>

/**
 * Error thrown when domain operations fail.
 * @since 0.0.1
 */
export class DomainError extends Error {
  readonly _tag = 'DomainError'
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

/**
 * Creates an EIP-712 domain from input.
 *
 * @param input - Domain configuration
 * @returns Effect yielding DomainType or failing with DomainError
 * @example
 * ```typescript
 * import * as Domain from 'voltaire-effect/Domain'
 * import { Effect } from 'effect'
 *
 * const program = Domain.from({ name: 'MyApp', version: '1', chainId: 1n })
 * const domain = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (input: DomainInput): Effect.Effect<DomainType, DomainError> =>
  Effect.try({
    try: () => Domain.from(input as any),
    catch: (e) => new DomainError((e as Error).message)
  })

/**
 * Computes the domain separator hash.
 *
 * @param domain - The domain to hash
 * @param crypto - Crypto provider with keccak256
 * @returns Effect yielding the domain separator
 * @since 0.0.1
 */
export const toHash = (
  domain: DomainType,
  crypto: { keccak256: (data: Uint8Array) => Uint8Array }
): Effect.Effect<DomainSeparatorType, DomainError> =>
  Effect.try({
    try: () => Domain.toHash(domain, crypto),
    catch: (e) => new DomainError((e as Error).message)
  })

/**
 * Encodes EIP-712 type definitions.
 *
 * @param primaryType - The primary type name
 * @param types - Type definitions
 * @returns Effect yielding encoded type string
 * @since 0.0.1
 */
export const encodeType = (
  primaryType: string,
  types: Record<string, readonly { readonly name: string; readonly type: string }[]>
): Effect.Effect<string, DomainError> =>
  Effect.try({
    try: () => Domain.encodeType(primaryType, types),
    catch: (e) => new DomainError((e as Error).message)
  })

/**
 * Computes the hash of an EIP-712 type.
 *
 * @param primaryType - The primary type name
 * @param types - Type definitions
 * @param crypto - Crypto provider with keccak256
 * @returns Effect yielding type hash
 * @since 0.0.1
 */
export const hashType = (
  primaryType: string,
  types: Record<string, readonly { readonly name: string; readonly type: string }[]>,
  crypto: { keccak256: (data: Uint8Array) => Uint8Array }
): Effect.Effect<Uint8Array, DomainError> =>
  Effect.try({
    try: () => Domain.hashType(primaryType, types, crypto),
    catch: (e) => new DomainError((e as Error).message)
  })

/**
 * Gets the EIP-712 domain type definition.
 *
 * @param domain - The domain
 * @returns Effect yielding array of field definitions
 * @since 0.0.1
 */
export const getEIP712DomainType = (domain: DomainType): Effect.Effect<Array<{ name: string; type: string }>, never> =>
  Effect.succeed(Domain.getEIP712DomainType(domain))

/**
 * Gets the fields bitmap for ERC-5267.
 *
 * @param domain - The domain
 * @returns Effect yielding bitmap bytes
 * @since 0.0.1
 */
export const getFieldsBitmap = (domain: DomainType): Effect.Effect<Uint8Array, never> =>
  Effect.succeed(Domain.getFieldsBitmap(domain))

/**
 * Converts domain to ERC-5267 response format.
 *
 * @param domain - The domain
 * @returns Effect yielding ERC-5267 response
 * @since 0.0.1
 */
export const toErc5267Response = (domain: DomainType): Effect.Effect<ReturnType<typeof Domain.toErc5267Response>, never> =>
  Effect.succeed(Domain.toErc5267Response(domain))
