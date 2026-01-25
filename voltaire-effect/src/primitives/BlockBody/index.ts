/**
 * @module BlockBody
 * @description Effect Schemas for Ethereum block bodies.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BlockBody from 'voltaire-effect/primitives/BlockBody'
 *
 * function extractTransactions(body: BlockBody.BlockBodyType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `BlockBody.Rpc` | RPC JSON object | BlockBodyType | Decodes JSON-RPC response format |
 * | `BlockBody.Schema` | BlockBodyType | BlockBodyType | Identity validation schema |
 *
 * ## Usage
 *
 * ```typescript
 * import * as BlockBody from 'voltaire-effect/primitives/BlockBody'
 * import * as S from 'effect/Schema'
 *
 * // Decode from RPC response
 * const rpcBody = {
 *   transactions: [...],
 *   uncles: [],
 *   withdrawals: []
 * }
 * const body = S.decodeSync(BlockBody.Rpc)(rpcBody)
 * console.log(body.transactions.length)
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { Rpc } from "./Rpc.js";
export {
	BlockBodySchema,
	BlockBodySchema as Schema,
} from "./BlockBodySchema.js";

// Re-export types from voltaire
import type { BlockBody } from "@tevm/voltaire";
export type BlockBodyType = BlockBody.BlockBodyType;
export type RpcBlockBody = BlockBody.RpcBlockBody;
export type RpcWithdrawal = BlockBody.RpcWithdrawal;
