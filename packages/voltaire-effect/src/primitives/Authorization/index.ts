/**
 * @module Authorization
 * @description Effect Schemas for EIP-7702 authorization tuples.
 *
 * EIP-7702 enables EOAs to delegate execution to smart contracts,
 * bringing account abstraction features to existing EOAs.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Authorization.Rpc` | JSON-RPC format | AuthorizationType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Authorization from 'voltaire-effect/primitives/Authorization'
 * import * as S from 'effect/Schema'
 *
 * // Decode from JSON-RPC format
 * const auth = S.decodeSync(Authorization.Rpc)({
 *   chainId: '1',
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   nonce: '0',
 *   yParity: 0,
 *   r: '0x...',
 *   s: '0x...'
 * })
 *
 * // Encode back to JSON-RPC format
 * const json = S.encodeSync(Authorization.Rpc)(auth)
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-7702
 * @since 0.1.0
 */

export { type AuthorizationInput, Rpc } from "./Rpc.js";
