import { Proxy, Address, Hex } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when proxy operations fail.
 *
 * @example
 * ```typescript
 * import { ProxyError } from 'voltaire-effect/primitives/Proxy'
 *
 * const error = new ProxyError('Invalid bytecode format')
 * console.log(error._tag) // 'ProxyError'
 * ```
 *
 * @since 0.0.1
 */
export class ProxyError {
  /** Discriminant tag for error identification */
  readonly _tag = 'ProxyError'
  /**
   * Creates a new ProxyError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Checks if bytecode is an ERC-1167 minimal proxy.
 *
 * @param bytecode - Contract bytecode as hex string or Uint8Array
 * @returns Effect that succeeds with true if ERC-1167, false otherwise
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { isErc1167 } from 'voltaire-effect/primitives/Proxy'
 *
 * const result = isErc1167('0x363d3d373d3d3d363d73...')
 * Effect.runSync(result) // true
 * ```
 *
 * @since 0.0.1
 */
export const isErc1167 = (bytecode: string | Uint8Array): Effect.Effect<boolean, ProxyError> =>
  Effect.try({
    try: () => Proxy.isErc1167(typeof bytecode === 'string' ? Hex.toBytes(bytecode) : bytecode),
    catch: (e) => new ProxyError((e as Error).message)
  })

/**
 * Extracts the implementation address from ERC-1167 minimal proxy bytecode.
 *
 * @param bytecode - ERC-1167 proxy bytecode as hex string or Uint8Array
 * @returns Effect that succeeds with implementation address or null if not ERC-1167
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { parseErc1167 } from 'voltaire-effect/primitives/Proxy'
 *
 * const impl = parseErc1167(proxyBytecode)
 * const address = Effect.runSync(impl) // 20-byte implementation address
 * ```
 *
 * @since 0.0.1
 */
export const parseErc1167 = (bytecode: string | Uint8Array): Effect.Effect<Uint8Array | null, ProxyError> =>
  Effect.try({
    try: () => Proxy.parseErc1167(typeof bytecode === 'string' ? Hex.toBytes(bytecode) : bytecode),
    catch: (e) => new ProxyError((e as Error).message)
  })

/**
 * Generates ERC-1167 minimal proxy bytecode for an implementation address.
 *
 * @param implementation - Implementation contract address
 * @returns Effect that succeeds with ERC-1167 proxy bytecode
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { generateErc1167 } from 'voltaire-effect/primitives/Proxy'
 *
 * const bytecode = generateErc1167('0x1234567890123456789012345678901234567890')
 * Effect.runSync(bytecode) // 55-byte ERC-1167 bytecode
 * ```
 *
 * @since 0.0.1
 */
export const generateErc1167 = (implementation: string | Uint8Array): Effect.Effect<Uint8Array, ProxyError> =>
  Effect.try({
    try: () => {
      const addr = typeof implementation === 'string' ? Address(implementation) : implementation
      return Proxy.generateErc1167(addr as Parameters<typeof Proxy.generateErc1167>[0])
    },
    catch: (e) => new ProxyError((e as Error).message)
  })
