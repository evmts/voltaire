/**
 * Proxy module for Effect-based proxy contract detection and generation.
 *
 * Provides Effect-wrapped operations for working with proxy contracts,
 * including ERC-1167 minimal proxy detection, parsing, and generation.
 *
 * @example
 * ```typescript
 * import * as Proxy from 'voltaire-effect/primitives/Proxy'
 * import * as Effect from 'effect/Effect'
 *
 * // Check if bytecode is ERC-1167
 * const isProxy = Proxy.isErc1167(bytecode)
 *
 * // Parse implementation address
 * const impl = Proxy.parseErc1167(bytecode)
 *
 * // Generate new proxy
 * const proxyCode = Proxy.generateErc1167(implementationAddress)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, Erc1167ResultSchema, type ProxySlotType, type Erc1167Result } from './ProxySchema.js'
export { isErc1167, parseErc1167, generateErc1167, ProxyError } from './from.js'
