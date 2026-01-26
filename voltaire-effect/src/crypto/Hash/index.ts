/**
 * @fileoverview Hash utility exports for Effect.
 *
 * @description
 * Re-exports message and typed data hashing utilities from the Signature module
 * and EIP712 module for convenient access.
 *
 * - `hashMessage` - EIP-191 personal_sign message hashing
 * - `hashTypedData` - EIP-712 typed structured data hashing
 *
 * @example Hash a personal_sign message
 * ```typescript
 * import { hashMessage, KeccakLive } from 'voltaire-effect/crypto/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hashMessage('Hello, Ethereum!').pipe(Effect.provide(KeccakLive))
 * const hash = await Effect.runPromise(program)
 * ```
 *
 * @example Hash EIP-712 typed data
 * ```typescript
 * import { hashTypedData, EIP712Live } from 'voltaire-effect/crypto/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const typedData = {
 *   domain: { name: 'MyDApp', version: '1', chainId: 1 },
 *   types: { Person: [{ name: 'name', type: 'string' }] },
 *   primaryType: 'Person',
 *   message: { name: 'Alice' }
 * }
 *
 * const program = hashTypedData(typedData).pipe(Effect.provide(EIP712Live))
 * const hash = await Effect.runPromise(program)
 * ```
 *
 * @module Hash
 * @since 0.0.1
 */

// Re-export hashMessage from Signature module
export { hashMessage } from "../Signature/hashMessage.js";

// Re-export hashTypedData from EIP712 module
export { hashTypedData } from "../EIP712/index.js";

// Re-export service dependencies for convenience
export { KeccakLive, KeccakService, KeccakTest } from "../Keccak256/index.js";
export { EIP712Live, EIP712Service, EIP712Test } from "../EIP712/index.js";
