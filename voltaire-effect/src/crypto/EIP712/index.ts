/**
 * @fileoverview EIP-712 typed structured data module for Effect.
 * Provides standard Ethereum typed data signing and verification.
 *
 * @module EIP712
 * @since 0.0.1
 *
 * @description
 * EIP-712 defines a standard for hashing and signing typed structured data.
 * This prevents signature reuse across different domains and provides human-readable
 * signing prompts in wallets. Key components:
 *
 * - Domain: Identifies the signing context (contract, chain, etc.)
 * - Types: Defines the structure of data being signed
 * - Message: The actual data to sign
 *
 * @example
 * ```typescript
 * import { EIP712Service, EIP712Live, signTypedData, verifyTypedData } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const typedData = {
 *   domain: { name: 'MyDApp', version: '1', chainId: 1 },
 *   types: { Person: [{ name: 'name', type: 'string' }] },
 *   primaryType: 'Person',
 *   message: { name: 'Alice' }
 * }
 *
 * const program = Effect.gen(function* () {
 *   const sig = yield* signTypedData(typedData, privateKey)
 *   return yield* verifyTypedData(sig, typedData, address)
 * }).pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-712 | EIP-712 Specification}
 */
export { EIP712Service, EIP712Live, EIP712Test, type EIP712ServiceShape } from './EIP712Service.js'
export { hashTypedData, signTypedData, verifyTypedData, recoverAddress, hashDomain, hashStruct } from './operations.js'
