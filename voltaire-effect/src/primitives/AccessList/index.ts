/**
 * @module AccessList
 * @description Effect Schemas for EIP-2930 access lists.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `AccessList.Rpc` | JSON-RPC format | BrandedAccessList |
 *
 * ## Usage
 *
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as S from 'effect/Schema'
 *
 * // Decode from JSON-RPC format
 * const accessList = S.decodeSync(AccessList.Rpc)([
 *   {
 *     address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *     storageKeys: ['0x0...1']
 *   }
 * ])
 *
 * // Encode back to JSON-RPC format
 * const json = S.encodeSync(AccessList.Rpc)(accessList)
 * ```
 *
 * @since 0.1.0
 */

export { type AccessListInput, type AccessListItemInput, Rpc } from "./Rpc.js";
